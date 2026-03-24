"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { getUploadUrl, getDownloadUrl, putObject } from "@/lib/storage/s3-client";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requestUploadUrlSchema, saveAttachmentMetadataSchema } from "@/lib/validation/schemas";
import { syncTaskToGitHub } from "@/server/actions/github-sync";
import { waitUntil } from "@vercel/functions";

/**
 * If the task is synced to GitHub, trigger a background sync to update screenshots
 */
async function syncAttachmentToGitHub(taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { githubIssueNumber: true },
  });
  if (task?.githubIssueNumber) {
    waitUntil(
      syncTaskToGitHub(taskId).catch(err => {
        console.error(`[Auto-Sync] Failed to sync attachments for task ${taskId}:`, err);
      })
    );
  }
}

export async function requestUploadUrl(data: {
  taskId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) {
  // Runtime validation
  const validated = requestUploadUrlSchema.parse(data);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify user has access to task's project
  // Subtasks don't have a sprintId — they link through parentTask
  const task = await db.task.findUnique({
    where: { id: validated.taskId },
    include: {
      sprint: {
        include: {
          project: {
            include: {
              members: { where: { userId: session.user.id } },
            },
          },
        },
      },
      parentTask: {
        include: {
          sprint: {
            include: {
              project: {
                include: {
                  members: { where: { userId: session.user.id } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Check members from the task's sprint, or the parent task's sprint for subtasks
  const projectMembers = task?.sprint?.project.members ?? task?.parentTask?.sprint?.project.members ?? [];

  if (!task || (projectMembers.length === 0 && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  // Generate unique key
  const key = `tasks/${validated.taskId}/${randomUUID()}-${validated.fileName}`;

  const uploadUrl = await getUploadUrl(key, validated.mimeType);

  return { uploadUrl, key };
}

export async function saveAttachmentMetadata(data: {
  taskId: string;
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  // Runtime validation
  const validated = saveAttachmentMetadataSchema.parse(data);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.taskAttachment.create({
    data: {
      taskId: validated.taskId,
      s3Key: validated.key,
      fileName: validated.fileName,
      mimeType: validated.mimeType,
      sizeBytes: validated.sizeBytes,
      uploadedBy: session.user.id,
    },
  });
}

export async function getTaskAttachments(taskId: string) {
  // Runtime validation
  z.string().min(1).parse(taskId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.taskAttachment.findMany({
    where: { taskId },
    include: {
      uploader: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAttachmentDownloadUrl(attachmentId: string) {
  // Runtime validation
  z.string().min(1).parse(attachmentId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) throw new Error("Attachment not found");

  return getDownloadUrl(attachment.s3Key, attachment.fileName);
}

export async function uploadAttachment(formData: FormData): Promise<{ success: true; attachment: { id: string; fileName: string } } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File;
    const taskId = formData.get("taskId") as string;

    if (!file || !taskId) return { success: false, error: "Missing file or taskId" };

    // Runtime validation
    z.string().min(1).parse(taskId);

    // Validate file size (4MB to stay within Vercel serverless payload limit)
    if (file.size > 4 * 1024 * 1024) {
      return { success: false, error: "File too large. Maximum size is 4MB" };
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
      "image/svg+xml", "image/bmp", "image/tiff",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff", ".pdf", ".doc", ".docx", ".xlsx", ".txt", ".csv"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      return { success: false, error: "Invalid file type. Only images, PDFs, and documents are allowed" };
    }

    // Verify user has access to task's project
    // Subtasks don't have a sprintId — they link through parentTask
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        sprint: {
          include: {
            project: {
              include: {
                members: { where: { userId: session.user.id } },
              },
            },
          },
        },
        parentTask: {
          include: {
            sprint: {
              include: {
                project: {
                  include: {
                    members: { where: { userId: session.user.id } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Check members from the task's sprint, or the parent task's sprint for subtasks
    const projectMembers = task?.sprint?.project.members ?? task?.parentTask?.sprint?.project.members ?? [];

    if (!task || (projectMembers.length === 0 && session.user.role !== "admin")) {
      return { success: false, error: "Unauthorized — you don't have access to this project" };
    }

    // Generate unique key and upload
    // Sanitize filename: remove spaces and special chars for S3 compatibility
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `tasks/${taskId}/${randomUUID()}-${safeName}`;

    let buffer: Buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch (err) {
      console.error("[Upload] Failed to read file buffer:", err);
      return { success: false, error: "Failed to read file data" };
    }

    try {
      await putObject(key, buffer, file.type || "application/octet-stream");
    } catch (err) {
      console.error("[Upload] S3 putObject failed:", err);
      return { success: false, error: `Storage upload failed: ${err instanceof Error ? err.message : "Unknown error"}` };
    }

    // Save metadata to DB
    const attachment = await db.taskAttachment.create({
      data: {
        taskId,
        s3Key: key,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        uploadedBy: session.user.id,
      },
    });

    // Sync to GitHub if task has a linked issue (updates screenshots in issue body)
    await syncAttachmentToGitHub(taskId);

    return { success: true, attachment: { id: attachment.id, fileName: attachment.fileName } };
  } catch (err) {
    console.error("[Upload] Unexpected error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function renameAttachment(attachmentId: string, newFileName: string) {
  z.string().min(1).parse(attachmentId);
  z.string().min(1).max(255).parse(newFileName);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) throw new Error("Attachment not found");

  // Only uploader or admin can rename
  if (attachment.uploadedBy !== session.user.id && session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Preserve the original file extension
  const origExt = attachment.fileName.includes(".")
    ? "." + attachment.fileName.split(".").pop()
    : "";
  const newExt = newFileName.includes(".")
    ? "." + newFileName.split(".").pop()
    : "";

  // If user didn't include the extension, append the original one
  const finalName = newExt ? newFileName : newFileName + origExt;

  const updated = await db.taskAttachment.update({
    where: { id: attachmentId },
    data: { fileName: finalName },
  });

  // Sync to GitHub to update image name in issue body
  await syncAttachmentToGitHub(attachment.taskId);

  return updated;
}

export async function deleteAttachment(attachmentId: string) {
  // Runtime validation
  z.string().min(1).parse(attachmentId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) throw new Error("Attachment not found");

  // Only uploader or admin can delete
  if (
    attachment.uploadedBy !== session.user.id &&
    session.user.role !== "admin"
  ) {
    throw new Error("Unauthorized");
  }

  const taskId = attachment.taskId;

  await db.taskAttachment.delete({
    where: { id: attachmentId },
  });

  // Sync to GitHub to remove the image from the issue body
  await syncAttachmentToGitHub(taskId);

  return { success: true };
}

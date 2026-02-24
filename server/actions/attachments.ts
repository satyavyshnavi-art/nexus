"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { getUploadUrl, getDownloadUrl, putObject } from "@/lib/storage/s3-client";
import { randomUUID } from "crypto";

export async function requestUploadUrl(data: {
  taskId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify user has access to task's project
  const task = await db.task.findUnique({
    where: { id: data.taskId },
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
      feature: {
        include: {
          project: {
            include: {
              members: { where: { userId: session.user.id } },
            },
          },
        },
      },
    },
  });

  const memberCount =
    (task?.sprint?.project.members.length ?? 0) +
    (task?.feature?.project.members.length ?? 0);

  if (!task || (memberCount === 0 && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  // Validate file size (e.g., max 10MB)
  if (data.fileSize > 10 * 1024 * 1024) {
    throw new Error("File too large");
  }

  // Generate unique key
  const key = `tasks/${data.taskId}/${randomUUID()}-${data.fileName}`;

  const uploadUrl = await getUploadUrl(key, data.mimeType);

  return { uploadUrl, key };
}

export async function saveAttachmentMetadata(data: {
  taskId: string;
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.taskAttachment.create({
    data: {
      taskId: data.taskId,
      s3Key: data.key,
      fileName: data.fileName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      uploadedBy: session.user.id,
    },
  });
}

export async function getTaskAttachments(taskId: string) {
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
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) throw new Error("Attachment not found");

  return getDownloadUrl(attachment.s3Key);
}

export async function uploadAttachment(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  const taskId = formData.get("taskId") as string;

  if (!file || !taskId) throw new Error("Missing file or taskId");

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 10MB");
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  // Verify user has access to task's project
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
      feature: {
        include: {
          project: {
            include: {
              members: { where: { userId: session.user.id } },
            },
          },
        },
      },
    },
  });

  const memberCount =
    (task?.sprint?.project.members.length ?? 0) +
    (task?.feature?.project.members.length ?? 0);

  if (!task || (memberCount === 0 && session.user.role !== "admin")) {
    throw new Error("Unauthorized");
  }

  // Generate unique key and upload
  const key = `tasks/${taskId}/${randomUUID()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await putObject(key, buffer, file.type);

  // Save metadata to DB
  const attachment = await db.taskAttachment.create({
    data: {
      taskId,
      s3Key: key,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedBy: session.user.id,
    },
  });

  return attachment;
}

export async function deleteAttachment(attachmentId: string) {
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

  return db.taskAttachment.delete({
    where: { id: attachmentId },
  });
}

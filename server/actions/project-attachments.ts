"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { putObject, getDownloadUrl, deleteObject } from "@/lib/storage/s3-client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

async function canAccessProject(
  projectId: string,
  userId: string,
  isAdmin: boolean
) {
  if (isAdmin) return true;

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  return !!membership;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".tiff",
  ".pdf",
  ".doc",
  ".docx",
  ".xlsx",
  ".txt",
  ".csv",
];

export async function uploadProjectAttachment(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  const projectId = formData.get("projectId") as string;

  if (!file || !projectId) throw new Error("Missing file or projectId");

  // Check project access
  const hasAccess = await canAccessProject(
    projectId,
    session.user.id,
    session.user.role === "admin"
  );
  if (!hasAccess) throw new Error("Unauthorized");

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 10MB");
  }

  // Validate file type
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("Invalid file type");
  }

  // Generate unique key and upload
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `projects/${projectId}/${randomUUID()}-${safeName}`;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (err) {
    console.error("[Upload] Failed to read file buffer:", err);
    throw new Error("Failed to read file data");
  }

  try {
    await putObject(key, buffer, file.type || "application/octet-stream");
  } catch (err) {
    console.error("[Upload] S3 putObject failed:", err);
    throw new Error(
      `Storage upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  // Save metadata to DB
  const attachment = await db.projectAttachment.create({
    data: {
      projectId,
      s3Key: key,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedBy: session.user.id,
    },
  });

  revalidatePath(`/projects/${projectId}/documents`);
  return attachment;
}

export async function getProjectAttachments(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const hasAccess = await canAccessProject(
    projectId,
    session.user.id,
    session.user.role === "admin"
  );
  if (!hasAccess) throw new Error("Unauthorized");

  return db.projectAttachment.findMany({
    where: { projectId },
    include: {
      uploader: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectAttachmentDownloadUrl(attachmentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const attachment = await db.projectAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) throw new Error("Attachment not found");

  // Verify project access
  const hasAccess = await canAccessProject(
    attachment.projectId,
    session.user.id,
    session.user.role === "admin"
  );
  if (!hasAccess) throw new Error("Unauthorized");

  return getDownloadUrl(attachment.s3Key);
}

export async function deleteProjectAttachment(attachmentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const attachment = await db.projectAttachment.findUnique({
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

  // Delete from S3
  try {
    await deleteObject(attachment.s3Key);
  } catch (err) {
    console.error("[Delete] S3 deleteObject failed:", err);
    // Continue to delete DB record even if S3 delete fails
  }

  await db.projectAttachment.delete({
    where: { id: attachmentId },
  });

  revalidatePath(`/projects/${attachment.projectId}/documents`);
  return { success: true };
}

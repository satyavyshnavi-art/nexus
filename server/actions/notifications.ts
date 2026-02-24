"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Internal helper (called from other server actions) ---

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await db.notification.create({ data });
  } catch (error) {
    // Non-blocking — don't fail the parent action if notification fails
    console.error("[Notification] Failed to create:", error);
  }
}

// --- Client-facing actions ---

export async function getNotifications(limit = 20) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.notification.count({
    where: { userId: session.user.id, read: false },
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });

  revalidatePath("/");
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/");
}

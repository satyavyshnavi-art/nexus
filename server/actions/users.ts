"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { UserRole } from "@prisma/client";

export async function getAllUsers() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}

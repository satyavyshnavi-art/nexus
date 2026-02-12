"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";

export async function createVertical(name: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.vertical.create({ data: { name } });
}

export async function assignUserToVertical(userId: string, verticalId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Idempotent insert
  return db.verticalUser.upsert({
    where: {
      verticalId_userId: { verticalId, userId },
    },
    create: { verticalId, userId },
    update: {},
  });
}

export async function getUserVerticals() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.vertical.findMany({
    where: {
      users: {
        some: { userId: session.user.id },
      },
    },
  });
}

export async function getAllVerticals() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.vertical.findMany({
    include: {
      _count: {
        select: { users: true, projects: true },
      },
    },
  });
}

export async function getVerticalWithUsers(verticalId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.vertical.findUnique({
    where: { id: verticalId },
    include: {
      users: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
}

export async function removeUserFromVertical(userId: string, verticalId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.verticalUser.delete({
    where: {
      verticalId_userId: { verticalId, userId },
    },
  });
}

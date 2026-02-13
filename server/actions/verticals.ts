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

export async function getVerticalDetails(verticalId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const vertical = await db.vertical.findUnique({
    where: { id: verticalId },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              designation: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              sprints: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          users: true,
          projects: true,
        },
      },
    },
  });

  if (!vertical) {
    throw new Error("Vertical not found");
  }

  return vertical;
}

export async function updateVertical(verticalId: string, name: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  if (!name || name.trim().length === 0) {
    throw new Error("Vertical name cannot be empty");
  }

  const updated = await db.vertical.update({
    where: { id: verticalId },
    data: { name: name.trim() },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/verticals");
  revalidatePath(`/admin/verticals/${verticalId}`);

  return updated;
}

export async function deleteVertical(verticalId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Check for existing projects
  const vertical = await db.vertical.findUnique({
    where: { id: verticalId },
    include: {
      _count: {
        select: { projects: true },
      },
    },
  });

  if (!vertical) {
    throw new Error("Vertical not found");
  }

  if (vertical._count.projects > 0) {
    throw new Error(
      `Cannot delete vertical with ${vertical._count.projects} project(s). Remove all projects first.`
    );
  }

  await db.vertical.delete({
    where: { id: verticalId },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/verticals");
}

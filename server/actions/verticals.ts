"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { z } from "zod";
import { verticalNameSchema } from "@/lib/validation/schemas";

export async function createVertical(name: string) {
  // Runtime validation
  const validatedName = verticalNameSchema.parse(name);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const vertical = await db.vertical.create({ data: { name: validatedName } });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/verticals");

  return vertical;
}

export async function assignUserToVertical(userId: string, verticalId: string) {
  // Runtime validation
  z.string().min(1).parse(userId);
  z.string().min(1).parse(verticalId);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Idempotent insert
  const result = await db.verticalUser.upsert({
    where: {
      verticalId_userId: { verticalId, userId },
    },
    create: { verticalId, userId },
    update: {},
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/verticals");
  revalidatePath(`/admin/verticals/${verticalId}`);
  revalidatePath("/team");

  return result;
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
  // Runtime validation
  z.string().min(1).parse(verticalId);

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
  // Runtime validation
  z.string().min(1).parse(userId);
  z.string().min(1).parse(verticalId);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const result = await db.verticalUser.delete({
    where: {
      verticalId_userId: { verticalId, userId },
    },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/verticals");
  revalidatePath(`/admin/verticals/${verticalId}`);
  revalidatePath("/team");

  return result;
}

export async function getVerticalDetails(verticalId: string) {
  // Runtime validation
  z.string().min(1).parse(verticalId);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const vertical = await db.vertical.findUnique({
    where: { id: verticalId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
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
  // Runtime validation
  z.string().min(1).parse(verticalId);
  const validatedName = verticalNameSchema.parse(name);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const updated = await db.vertical.update({
    where: { id: verticalId },
    data: { name: validatedName.trim() },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/verticals");
  revalidatePath(`/admin/verticals/${verticalId}`);

  return updated;
}

export async function deleteVertical(verticalId: string) {
  // Runtime validation
  z.string().min(1).parse(verticalId);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Check for existing projects and users
  const vertical = await db.vertical.findUnique({
    where: { id: verticalId },
    include: {
      _count: {
        select: { projects: true, users: true },
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

  // Delete related VerticalUser records first, then the vertical itself
  // Using a transaction ensures atomicity — either both operations succeed or neither does
  await db.$transaction(async (tx) => {
    // Delete all VerticalUser records for this vertical
    if (vertical._count.users > 0) {
      await tx.verticalUser.deleteMany({
        where: { verticalId },
      });
    }

    // Now delete the vertical itself
    await tx.vertical.delete({
      where: { id: verticalId },
    });
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/verticals");
  revalidatePath("/admin");
  revalidatePath("/team");
}

export async function getVerticalsWithProjects() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.vertical.findMany({
    include: {
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
    orderBy: {
      name: "asc",
    },
  });
}

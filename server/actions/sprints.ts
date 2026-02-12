"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { SprintStatus } from "@prisma/client";

export async function createSprint(data: {
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  if (data.endDate < data.startDate) {
    throw new Error("End date must be after start date");
  }

  return db.sprint.create({
    data: {
      ...data,
      createdBy: session.user.id,
    },
  });
}

export async function activateSprint(sprintId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Transaction to enforce one active sprint rule
  return db.$transaction(async (tx) => {
    const sprint = await tx.sprint.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) throw new Error("Sprint not found");

    // Check for existing active sprint in same project
    const existingActive = await tx.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        status: SprintStatus.active,
      },
    });

    if (existingActive) {
      throw new Error("Another sprint is already active. Complete it first.");
    }

    return tx.sprint.update({
      where: { id: sprintId },
      data: { status: SprintStatus.active },
    });
  });
}

export async function completeSprint(sprintId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.sprint.update({
    where: { id: sprintId },
    data: { status: SprintStatus.completed },
  });
}

export async function getActiveSprint(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.sprint.findFirst({
    where: {
      projectId,
      status: SprintStatus.active,
    },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getProjectSprints(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.sprint.findMany({
    where: { projectId },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

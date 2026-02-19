"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { SprintStatus } from "@prisma/client";
import { unstable_cache, revalidatePath } from "next/cache";

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

  try {
    const sprint = await db.sprint.create({
      data: {
        ...data,
        createdBy: session.user.id,
      },
    });

    // Revalidate caches
    revalidatePath(`/projects/${data.projectId}`);

    return sprint;
  } catch (error) {
    throw error;
  }
}

export async function activateSprint(sprintId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Transaction to enforce one active sprint rule
  const result = await db.$transaction(async (tx) => {
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

  // Revalidate caches
  revalidatePath(`/projects/${result.projectId}`);

  return result;
}

export async function completeSprint(sprintId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const sprint = await db.sprint.update({
    where: { id: sprintId },
    data: { status: SprintStatus.completed },
  });

  // Revalidate caches
  revalidatePath(`/projects/${sprint.projectId}`);

  return sprint;
}

export async function getActiveSprint(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Cached query - 30 second cache for active sprint
  const getCachedActiveSprint = unstable_cache(
    async (projectId: string) => {
      return db.sprint.findFirst({
        where: {
          projectId,
          status: SprintStatus.active,
        },
        include: {
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              childTasks: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  priority: true,
                  type: true,
                },
                orderBy: { createdAt: "asc" },
              },
              _count: {
                select: { comments: true, attachments: true, childTasks: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    },
    [`active-sprint-${projectId}`],
    {
      revalidate: 30,
    }
  );

  const sprint = await getCachedActiveSprint(projectId);

  if (!sprint) return null;

  // Serialize BigInt fields for client components
  return {
    ...sprint,
    tasks: sprint.tasks.map((task) => ({
      ...task,
      githubIssueId: task.githubIssueId?.toString() || null,
    })),
  };
}

export async function getProjectSprints(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Cached query - 30 second cache for project sprints
  const getCachedProjectSprints = unstable_cache(
    async (projectId: string) => {
      return db.sprint.findMany({
        where: { projectId },
        include: {
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },
    [`project-sprints-${projectId}`],
    {
      revalidate: 30,
    }
  );

  return getCachedProjectSprints(projectId);
}

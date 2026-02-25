"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { SprintStatus, TaskStatus } from "@prisma/client";
import { revalidatePath, unstable_cache } from "next/cache";

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
    revalidatePath(`/projects/${data.projectId}/sprints`);

    return sprint;
  } catch (error) {
    throw error;
  }
}

export async function updateSprint(
  sprintId: string,
  data: { name?: string; startDate?: Date; endDate?: Date }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    throw new Error("End date must be after start date");
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: { id: true, projectId: true, status: true },
  });

  if (!sprint) throw new Error("Sprint not found");
  if (sprint.status === "completed") {
    throw new Error("Cannot edit a completed sprint");
  }

  const updated = await db.sprint.update({
    where: { id: sprintId },
    data,
  });

  revalidatePath(`/projects/${sprint.projectId}`);
  revalidatePath(`/projects/${sprint.projectId}/sprints`);

  return updated;
}

export async function deleteSprint(sprintId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: { id: true, projectId: true, status: true },
  });

  if (!sprint) throw new Error("Sprint not found");
  if (sprint.status === "active") {
    throw new Error("Cannot delete an active sprint. Complete it first.");
  }

  await db.sprint.delete({ where: { id: sprintId } });

  revalidatePath(`/projects/${sprint.projectId}`);
  revalidatePath(`/projects/${sprint.projectId}/sprints`);

  return { success: true };
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
  revalidatePath(`/projects/${result.projectId}/sprints`);

  return result;
}

export interface CompleteSprintOptions {
  incompleteTaskAction: "keep" | "moveToNext";
  targetSprintId?: string;
}

export interface CompleteSprintResult {
  sprint: { id: string; name: string; projectId: string };
  completedTaskCount: number;
  incompleteTaskCount: number;
  movedTaskCount: number;
}

export async function completeSprint(
  sprintId: string,
  options?: CompleteSprintOptions
): Promise<CompleteSprintResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const result = await db.$transaction(async (tx) => {
    const sprint = await tx.sprint.findUnique({
      where: { id: sprintId },
      include: {
        tasks: {
          select: { id: true, status: true, parentTaskId: true },
        },
      },
    });

    if (!sprint) throw new Error("Sprint not found");
    if (sprint.status !== SprintStatus.active) {
      throw new Error("Only active sprints can be completed");
    }

    const completedTasks = sprint.tasks.filter(
      (t) => t.status === TaskStatus.done
    );
    const incompleteTasks = sprint.tasks.filter(
      (t) => t.status !== TaskStatus.done
    );

    let movedTaskCount = 0;

    // Move incomplete stories (parentTaskId=null) to target sprint if requested.
    // Child tasks (tickets/subtasks) cascade via the Prisma relation since they
    // share the same sprintId — we move them explicitly here.
    if (
      options?.incompleteTaskAction === "moveToNext" &&
      options.targetSprintId &&
      incompleteTasks.length > 0
    ) {
      // Verify target sprint exists and is planned
      const targetSprint = await tx.sprint.findUnique({
        where: { id: options.targetSprintId },
      });

      if (!targetSprint) throw new Error("Target sprint not found");
      if (targetSprint.projectId !== sprint.projectId) {
        throw new Error("Target sprint must be in the same project");
      }

      // Get incomplete top-level stories (parentTaskId = null)
      const incompleteStoryIds = incompleteTasks
        .filter((t) => t.parentTaskId === null)
        .map((t) => t.id);

      // Move the stories themselves
      if (incompleteStoryIds.length > 0) {
        await tx.task.updateMany({
          where: {
            id: { in: incompleteStoryIds },
          },
          data: { sprintId: options.targetSprintId },
        });

        // Move all child tasks (tickets + subtasks) of those stories
        await tx.task.updateMany({
          where: {
            parentTaskId: { in: incompleteStoryIds },
          },
          data: { sprintId: options.targetSprintId },
        });

        // Move grandchild tasks (subtasks under tickets) — find ticket IDs first
        const ticketIds = sprint.tasks
          .filter((t) => incompleteStoryIds.includes(t.parentTaskId ?? ""))
          .map((t) => t.id);

        if (ticketIds.length > 0) {
          await tx.task.updateMany({
            where: {
              parentTaskId: { in: ticketIds },
            },
            data: { sprintId: options.targetSprintId },
          });
        }
      }

      // Also move any orphan incomplete tasks that don't have a parent
      const orphanIncomplete = incompleteTasks
        .filter(
          (t) =>
            t.parentTaskId === null && !incompleteStoryIds.includes(t.id)
        )
        .map((t) => t.id);

      if (orphanIncomplete.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: orphanIncomplete } },
          data: { sprintId: options.targetSprintId },
        });
      }

      movedTaskCount = incompleteTasks.length;
    }

    // Complete the sprint
    const updatedSprint = await tx.sprint.update({
      where: { id: sprintId },
      data: {
        status: SprintStatus.completed,
        completedAt: new Date(),
      },
    });

    return {
      sprint: {
        id: updatedSprint.id,
        name: updatedSprint.name,
        projectId: updatedSprint.projectId,
      },
      completedTaskCount: completedTasks.length,
      incompleteTaskCount: incompleteTasks.length,
      movedTaskCount,
    };
  });

  // Revalidate caches
  revalidatePath(`/projects/${result.sprint.projectId}`);
  revalidatePath(`/projects/${result.sprint.projectId}/sprints`);

  return result;
}

export async function getActiveSprint(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const sprint = await db.sprint.findFirst({
    where: {
      projectId,
      status: SprintStatus.active,
    },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          parentTask: { select: { id: true, title: true } },
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
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!sprint) return null;

  // Serialize BigInt fields for client components
  return {
    ...sprint,
    tasks: sprint.tasks.map((t) => ({
      ...t,
      githubIssueId: t.githubIssueId?.toString() || null,
    })),
  };
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

/**
 * Cached variant — skips auth() when the caller already has the session.
 */
export async function getProjectSprintsCached(projectId: string) {
  const getCached = unstable_cache(
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
      tags: [`project-${projectId}-sprints`],
    }
  );
  return getCached(projectId);
}

export async function getPlannedSprints(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.sprint.findMany({
    where: {
      projectId,
      status: SprintStatus.planned,
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: "asc" },
  });
}

export interface SprintProgressData {
  id: string;
  name: string;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  totalTasks: number;
  tasksByStatus: {
    todo: number;
    progress: number;
    review: number;
    done: number;
  };
  completionPercentage: number;
  storyPoints: {
    completed: number;
    total: number;
  };
}

export async function getSprintProgress(
  sprintId: string
): Promise<SprintProgressData | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
          storyPoints: true,
          type: true,
        },
      },
    },
  });

  if (!sprint) return null;

  // Only count tickets (type = "task" or "bug") for progress, not stories or subtasks
  const tickets = sprint.tasks.filter(
    (t) => t.type !== "story" && t.type !== "subtask"
  );

  const totalTasks = tickets.length;
  const tasksByStatus = {
    todo: tickets.filter((t) => t.status === "todo").length,
    progress: tickets.filter((t) => t.status === "progress").length,
    review: tickets.filter((t) => t.status === "review").length,
    done: tickets.filter((t) => t.status === "done").length,
  };

  const completionPercentage =
    totalTasks > 0
      ? Math.round((tasksByStatus.done / totalTasks) * 100)
      : 0;

  const totalStoryPoints = tickets.reduce(
    (sum, t) => sum + (t.storyPoints ?? 0),
    0
  );
  const completedStoryPoints = tickets
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

  return {
    id: sprint.id,
    name: sprint.name,
    status: sprint.status,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    totalTasks,
    tasksByStatus,
    completionPercentage,
    storyPoints: {
      completed: completedStoryPoints,
      total: totalStoryPoints,
    },
  };
}

export interface SprintDetailData {
  id: string;
  name: string;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  completedAt: Date | null;
  createdAt: Date;
  creator: { id: string; name: string | null; email: string };
  completionPercentage: number;
  totalTasks: number;
  tasksByStatus: {
    todo: number;
    progress: number;
    review: number;
    done: number;
  };
  storyPoints: { completed: number; total: number };
  velocity: number;
  durationDays: number;
  completedTasks: SprintDetailTask[];
  incompleteTasks: SprintDetailTask[];
  teamMembers: SprintTeamMember[];
}

export interface SprintDetailTask {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  assignee: { id: string; name: string | null; email: string; avatar: string | null } | null;
}

export interface SprintTeamMember {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  taskCount: number;
  completedTaskCount: number;
  storyPointsDelivered: number;
}

export async function getSprintDetail(
  sprintId: string
): Promise<SprintDetailData | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!sprint) return null;

  // Only count tickets (type = "task" or "bug") for progress metrics, not stories or subtasks
  const tickets = sprint.tasks.filter(
    (t) => t.type !== "story" && t.type !== "subtask"
  );

  const totalTasks = tickets.length;
  const tasksByStatus = {
    todo: tickets.filter((t) => t.status === "todo").length,
    progress: tickets.filter((t) => t.status === "progress").length,
    review: tickets.filter((t) => t.status === "review").length,
    done: tickets.filter((t) => t.status === "done").length,
  };

  const completionPercentage =
    totalTasks > 0
      ? Math.round((tasksByStatus.done / totalTasks) * 100)
      : 0;

  const totalStoryPoints = tickets.reduce(
    (sum, t) => sum + (t.storyPoints ?? 0),
    0
  );
  const completedStoryPoints = tickets
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

  // Calculate duration in days
  const startMs = new Date(sprint.startDate).getTime();
  const endMs = sprint.completedAt
    ? new Date(sprint.completedAt).getTime()
    : new Date(sprint.endDate).getTime();
  const durationDays = Math.max(
    1,
    Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24))
  );

  // Split tasks — show only tickets in completed/incomplete lists
  const completedTasks: SprintDetailTask[] = tickets
    .filter((t) => t.status === "done")
    .map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      storyPoints: t.storyPoints,
      assignee: t.assignee,
    }));

  const incompleteTasks: SprintDetailTask[] = tickets
    .filter((t) => t.status !== "done")
    .map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      storyPoints: t.storyPoints,
      assignee: t.assignee,
    }));

  // Aggregate team members from ticket assignees only
  const memberMap = new Map<string, SprintTeamMember>();
  for (const task of tickets) {
    if (!task.assignee) continue;
    const existing = memberMap.get(task.assignee.id);
    if (existing) {
      existing.taskCount++;
      if (task.status === "done") {
        existing.completedTaskCount++;
        existing.storyPointsDelivered += task.storyPoints ?? 0;
      }
    } else {
      memberMap.set(task.assignee.id, {
        id: task.assignee.id,
        name: task.assignee.name,
        email: task.assignee.email,
        avatar: task.assignee.avatar,
        taskCount: 1,
        completedTaskCount: task.status === "done" ? 1 : 0,
        storyPointsDelivered:
          task.status === "done" ? (task.storyPoints ?? 0) : 0,
      });
    }
  }

  return {
    id: sprint.id,
    name: sprint.name,
    status: sprint.status,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    completedAt: sprint.completedAt,
    createdAt: sprint.createdAt,
    creator: sprint.creator,
    completionPercentage,
    totalTasks,
    tasksByStatus,
    storyPoints: { completed: completedStoryPoints, total: totalStoryPoints },
    velocity: completedStoryPoints,
    durationDays,
    completedTasks,
    incompleteTasks,
    teamMembers: Array.from(memberMap.values()).sort(
      (a, b) => b.storyPointsDelivered - a.storyPointsDelivered
    ),
  };
}

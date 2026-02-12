"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { classifyBugPriority } from "@/lib/ai/bug-classifier";

// OPTIMIZED: Fast permission check (1 query instead of nested includes)
async function canAccessTask(taskId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  const result = await db.task.findFirst({
    where: {
      id: taskId,
      sprint: {
        project: {
          OR: [
            { members: { some: { userId } } },
            { vertical: { users: { some: { userId } } } },
          ],
        },
      },
    },
    select: { id: true },
  });

  return !!result;
}

export async function createTask(data: {
  sprintId: string;
  title: string;
  description?: string;
  type: TaskType;
  storyPoints?: number;
  assigneeId?: string;
  parentTaskId?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify user has project access
  const sprint = await db.sprint.findUnique({
    where: { id: data.sprintId },
    include: {
      project: {
        include: {
          members: { where: { userId: session.user.id } },
        },
      },
    },
  });

  if (
    !sprint ||
    (sprint.project.members.length === 0 && session.user.role !== "admin")
  ) {
    throw new Error("Unauthorized");
  }

  // Verify assignee is project member
  if (data.assigneeId) {
    const isMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: sprint.projectId,
          userId: data.assigneeId,
        },
      },
    });
    if (!isMember && session.user.role !== "admin") {
      throw new Error("Assignee not a project member");
    }
  }

  const task = await db.task.create({
    data: {
      ...data,
      createdBy: session.user.id,
    },
  });

  // Trigger AI bug classification asynchronously
  if (data.type === TaskType.bug && data.description) {
    classifyBugPriority(task.id, data.description).catch(console.error);
  }

  return task;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // OPTIMIZED: Fast permission check
  const hasAccess = await canAccessTask(
    taskId,
    session.user.id,
    session.user.role === "admin"
  );

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  return db.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    storyPoints?: number;
    assigneeId?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // OPTIMIZED: Fast permission check
  const hasAccess = await canAccessTask(
    taskId,
    session.user.id,
    session.user.role === "admin"
  );

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  return db.task.update({
    where: { id: taskId },
    data,
  });
}

export async function addComment(taskId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.taskComment.create({
    data: {
      taskId,
      userId: session.user.id,
      content,
    },
  });
}

export async function getTaskComments(taskId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.taskComment.findMany({
    where: { taskId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

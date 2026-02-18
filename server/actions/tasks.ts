"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { classifyBugPriority } from "@/lib/ai/bug-classifier";
import { unstable_cache, revalidatePath } from "next/cache";
import { calculateTaskProgress } from "@/lib/utils/task-progress";
import { syncTaskToGitHub } from "@/server/actions/github-sync";


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
  pushToGitHub?: boolean;
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

  const { pushToGitHub, ...taskData } = data;

  const task = await db.task.create({
    data: {
      ...taskData,
      createdBy: session.user.id,
    },
  });

  // Only sync to GitHub if the user opted in
  if (pushToGitHub) {
    syncTaskToGitHub(task.id).catch(err => {
      console.error(`[Auto-Sync] Failed to sync new task ${task.id}:`, err);
    });
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

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      // When marked done, also set githubStatus to closed (issue will be closed on GitHub)
      // When moved away from done, reset githubStatus to open
      ...(newStatus === "done"
        ? { githubStatus: "closed" }
        : { githubStatus: "open" }),
    },
    include: {
      sprint: {
        select: { projectId: true },
      },
    },
  });

  // Trigger GitHub Sync asynchronously
  syncTaskToGitHub(taskId).catch(err => {
    console.error(`[Auto-Sync] Failed to sync updated task status ${taskId}:`, err);
  });

  // Revalidate the project page to reflect the updated task status
  revalidatePath(`/projects/${updatedTask.sprint.projectId}`);

  return updatedTask;
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

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data,
    include: {
      sprint: {
        select: { projectId: true },
      },
    },
  });

  // Trigger GitHub Sync asynchronously
  syncTaskToGitHub(taskId).catch(err => {
    console.error(`[Auto-Sync] Failed to sync updated task ${taskId}:`, err);
  });

  // Revalidate the project page to reflect the updated task
  revalidatePath(`/projects/${updatedTask.sprint.projectId}`);

  return updatedTask;
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

/**
 * Fetches a task with all related data including progress calculation
 * Uses caching for 30-second revalidation window
 * Includes parent task info, subtasks, comments count, and attachments count
 */
export async function getTaskWithProgress(taskId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Cached query with 30-second revalidation
  const getCachedTask = unstable_cache(
    async (taskId: string) => {
      return db.task.findUnique({
        where: { id: taskId },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          sprint: {
            select: {
              id: true,
              name: true,
              status: true,
              projectId: true,
            },
          },
          parentTask: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          childTasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              assigneeId: true,
            },
          },
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              sizeBytes: true,
              createdAt: true,
              uploader: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    },
    [`task-${taskId}`],
    {
      revalidate: 30,
      tags: [`task-${taskId}`, "tasks"],
    }
  );

  const task = await getCachedTask(taskId);

  if (!task) throw new Error("Task not found");

  // Verify access to task
  const hasAccess = await canAccessTask(
    taskId,
    session.user.id,
    session.user.role === "admin"
  );

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // Calculate progress
  const progress = calculateTaskProgress({
    status: task.status,
    childTasks: task.childTasks,
  });

  return {
    ...task,
    progress: {
      percentage: progress,
      hasSubtasks: task.childTasks.length > 0,
      subtaskCount: task.childTasks.length,
      completedSubtasks: task.childTasks.filter(
        (t) => t.status === TaskStatus.done
      ).length,
    },
    meta: {
      commentsCount: task.comments.length,
      attachmentsCount: task.attachments.length,
    },
  };
}

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
          members: { some: { userId } },
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

  const isAdmin = session.user.role === "admin";

  // OPTIMIZED: Single query to get sprint and verify access + assignee in one go
  const sprint = await db.sprint.findUnique({
    where: { id: data.sprintId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          id: true,
          members: {
            where: {
              OR: [
                { userId: session.user.id }, // User access check
                ...(data.assigneeId ? [{ userId: data.assigneeId }] : []), // Assignee check
              ],
            },
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!sprint) {
    throw new Error("Sprint not found");
  }

  // Check user has access (admin or is project member)
  const hasAccess = isAdmin || sprint.project.members.some(m => m.userId === session.user.id);
  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // Check assignee is project member (if assignee specified)
  if (data.assigneeId && !isAdmin) {
    const assigneeIsMember = sprint.project.members.some(m => m.userId === data.assigneeId);
    if (!assigneeIsMember) {
      throw new Error("Assignee not a project member");
    }
  }

  const { pushToGitHub, ...taskData } = data;

  // Create task
  const task = await db.task.create({
    data: {
      ...taskData,
      createdBy: session.user.id,
    },
  });

  // Revalidate cache immediately for instant UI update
  revalidatePath(`/projects/${sprint.projectId}`);

  // Only sync to GitHub if the user opted in (async, non-blocking)
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

  // Determine GitHub status based on Nexus status
  // done/review = closed in GitHub, everything else = open
  const githubStatus = (newStatus === "done" || newStatus === "review") ? "closed" : "open";

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      githubStatus,
      // Set sync timestamp now so webhook loop prevention works
      githubSyncedAt: new Date(),
    },
    include: {
      sprint: {
        select: { projectId: true },
      },
    },
  });

  // Only sync to GitHub if the task is linked to a GitHub issue
  if (updatedTask.githubIssueNumber) {
    syncTaskToGitHub(taskId).catch(err => {
      console.error(`[Auto-Sync] Failed to sync task ${taskId} to GitHub:`, err);
    });
  }

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
    githubIssueId: task.githubIssueId?.toString() || null,
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

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      sprint: {
        select: { projectId: true },
      },
      // Check project membership for permission
      creator: { select: { id: true } },
    }
  });

  if (!task) throw new Error("Task not found");

  // Check permissions: Admin, Project Member, or Task Creator?
  // Usually admins or project members can delete. Let's start with safe permissions.
  // Re-using logic: must be admin or project member to access.
  const hasAccess = await canAccessTask(taskId, session.user.id, isAdmin);
  if (!hasAccess) throw new Error("Unauthorized");

  // If we want stricter delete permissions (e.g. only admins or creators), we can add that here.
  // For now, let's allow project members to delete tasks as per general kanban rules often seen.

  await db.task.delete({
    where: { id: taskId },
  });

  revalidatePath(`/projects/${task.sprint.projectId}`);
  return { success: true };
}

"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { classifyBugPriority } from "@/lib/ai/bug-classifier";
import { unstable_cache, revalidatePath } from "next/cache";
import { calculateTaskProgress } from "@/lib/utils/task-progress";
import { syncTaskToGitHub } from "@/server/actions/github-sync";


// OPTIMIZED: Fast permission check (supports tasks with sprint, feature, or both)
async function canAccessTask(taskId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  // Try sprint-based access first
  const viaSprintResult = await db.task.findFirst({
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

  if (viaSprintResult) return true;

  // Try feature-based access (for tasks without a sprint, or with a feature)
  const viaFeatureResult = await db.task.findFirst({
    where: {
      id: taskId,
      feature: {
        project: {
          members: { some: { userId } },
        },
      },
    },
    select: { id: true },
  });

  return !!viaFeatureResult;
}

export async function createTask(data: {
  sprintId?: string;
  featureId?: string;
  title: string;
  description?: string;
  type: TaskType;
  storyPoints?: number;
  assigneeId?: string;
  parentTaskId?: string;
  pushToGitHub?: boolean;
  requiredRole?: string;
  labels?: string[];
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  let projectId: string | null = null;
  let projectMembers: { userId: string }[] = [];

  // Verify sprint access if sprintId is provided
  if (data.sprintId) {
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
                  { userId: session.user.id },
                  ...(data.assigneeId ? [{ userId: data.assigneeId }] : []),
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

    projectId = sprint.projectId;
    projectMembers = sprint.project.members;
  }

  // Verify feature access if featureId is provided
  if (data.featureId) {
    const feature = await db.feature.findUnique({
      where: { id: data.featureId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            members: {
              where: {
                OR: [
                  { userId: session.user.id },
                  ...(data.assigneeId ? [{ userId: data.assigneeId }] : []),
                ],
              },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!feature) {
      throw new Error("Feature not found");
    }

    // If we already have a projectId from sprint, verify they belong to the same project
    if (projectId && projectId !== feature.projectId) {
      throw new Error("Sprint and feature must belong to the same project");
    }

    projectId = feature.projectId;
    // Merge members if we have both sprint and feature (use the larger set)
    if (projectMembers.length === 0) {
      projectMembers = feature.project.members;
    }
  }

  // If we have a projectId (from sprint or feature), check access
  if (projectId) {
    const hasAccess = isAdmin || projectMembers.some(m => m.userId === session.user.id);
    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    // Check assignee is project member (if assignee specified)
    if (data.assigneeId && !isAdmin) {
      const assigneeIsMember = projectMembers.some(m => m.userId === data.assigneeId);
      if (!assigneeIsMember) {
        throw new Error("Assignee not a project member");
      }
    }
  } else if (!isAdmin) {
    // No sprint or feature — standalone task: only admins can create standalone tasks
    // Or if you want to allow any authenticated user, remove this check
    // For now, allow any authenticated user to create standalone tasks
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
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }

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
      feature: {
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
  const revalidateProjectId = updatedTask.sprint?.projectId ?? updatedTask.feature?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

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
    requiredRole?: string;
    labels?: string[];
    featureId?: string | null;
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
      feature: {
        select: { projectId: true },
      },
    },
  });

  // Trigger GitHub Sync asynchronously
  syncTaskToGitHub(taskId).catch(err => {
    console.error(`[Auto-Sync] Failed to sync updated task ${taskId}:`, err);
  });

  // Revalidate the project page to reflect the updated task
  const revalidateProjectId = updatedTask.sprint?.projectId ?? updatedTask.feature?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

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
          feature: {
            select: {
              id: true,
              title: true,
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
      feature: {
        select: { projectId: true },
      },
      // Check project membership for permission
      creator: { select: { id: true } },
    }
  });

  if (!task) throw new Error("Task not found");

  // Check permissions: Admin, Project Member, or Task Creator?
  const hasAccess = await canAccessTask(taskId, session.user.id, isAdmin);
  if (!hasAccess) throw new Error("Unauthorized");

  await db.task.delete({
    where: { id: taskId },
  });

  const revalidateProjectId = task.sprint?.projectId ?? task.feature?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  return { success: true };
}

/**
 * Creates a subtask (child task) under a parent task.
 * Inherits featureId and sprintId from the parent task.
 */
export async function createSubtask(
  parentTaskId: string,
  data: {
    title: string;
    description?: string;
    assigneeId?: string;
    priority?: TaskPriority;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  // Fetch the parent task to inherit sprintId and featureId
  const parentTask = await db.task.findUnique({
    where: { id: parentTaskId },
    select: {
      id: true,
      sprintId: true,
      featureId: true,
      sprint: {
        select: {
          projectId: true,
          project: {
            select: {
              members: {
                where: {
                  OR: [
                    { userId: session.user.id },
                    ...(data.assigneeId ? [{ userId: data.assigneeId }] : []),
                  ],
                },
                select: { userId: true },
              },
            },
          },
        },
      },
      feature: {
        select: {
          projectId: true,
          project: {
            select: {
              members: {
                where: {
                  OR: [
                    { userId: session.user.id },
                    ...(data.assigneeId ? [{ userId: data.assigneeId }] : []),
                  ],
                },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!parentTask) {
    throw new Error("Parent task not found");
  }

  // Check access via sprint or feature
  const projectMembers =
    parentTask.sprint?.project.members ?? parentTask.feature?.project.members ?? [];

  const hasAccess = isAdmin || projectMembers.some(m => m.userId === session.user.id);
  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // Check assignee is project member (if specified)
  if (data.assigneeId && !isAdmin) {
    const assigneeIsMember = projectMembers.some(m => m.userId === data.assigneeId);
    if (!assigneeIsMember) {
      throw new Error("Assignee not a project member");
    }
  }

  // Create the subtask, inheriting sprint and feature from parent
  const subtask = await db.task.create({
    data: {
      title: data.title,
      description: data.description,
      assigneeId: data.assigneeId,
      priority: data.priority ?? "medium",
      type: "task",
      sprintId: parentTask.sprintId,
      featureId: parentTask.featureId,
      parentTaskId: parentTaskId,
      createdBy: session.user.id,
    },
  });

  // Revalidate cache
  const revalidateProjectId =
    parentTask.sprint?.projectId ?? parentTask.feature?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  return subtask;
}

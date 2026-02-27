"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { classifyBugPriority } from "@/lib/ai/bug-classifier";
import { revalidatePath } from "next/cache";
import { calculateTaskProgress } from "@/lib/utils/task-progress";
import { syncTaskToGitHub } from "@/server/actions/github-sync";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createSubtaskSchema,
  createStorySchema,
  createTicketSchema,
  createCommentSchema,
} from "@/lib/validation/schemas";


// ─── Internal helper: recalculate a ticket's status based on subtask completion ───
// Not exported — used internally after subtask creation or status changes.
async function recalculateTicketStatus(ticketId: string) {
  const ticket = await db.task.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      status: true,
      sprintId: true,
      sprint: { select: { projectId: true } },
      childTasks: {
        select: { id: true, status: true },
      },
    },
  });

  if (!ticket) return;

  // Admin override: if ticket is already "done", skip recalculation
  if (ticket.status === "done") return;

  const total = ticket.childTasks.length;
  if (total === 0) return;

  const doneCount = ticket.childTasks.filter(
    (t) => t.status === TaskStatus.done
  ).length;

  let newStatus: TaskStatus;
  if (doneCount === 0) {
    newStatus = "todo";
  } else if (doneCount < total) {
    newStatus = "progress";
  } else {
    // 100% done → move to review (not done — that's admin override)
    newStatus = "review";
  }

  // Only update if status actually changed
  if (ticket.status !== newStatus) {
    await db.task.update({
      where: { id: ticketId },
      data: { status: newStatus },
    });

    // Revalidate the project path
    if (ticket.sprint?.projectId) {
      revalidatePath(`/projects/${ticket.sprint.projectId}`);
    }
  }
}


// ─── Permission check ───
// Checks via sprint→project→members. For tasks without a sprint (or subtasks),
// walks up the parent chain to find a task with a sprintId, then checks membership.
async function canAccessTask(taskId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  // Single query: fetch task with all ancestral sprints up to 3 levels deep
  // This avoids N+1 loops and deep `OR` traversals
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      sprint: { select: { project: { select: { members: { where: { userId }, select: { userId: true } } } } } },
      parentTask: {
        select: {
          sprint: { select: { project: { select: { members: { where: { userId }, select: { userId: true } } } } } },
          parentTask: {
            select: {
              sprint: { select: { project: { select: { members: { where: { userId }, select: { userId: true } } } } } },
            },
          },
        },
      },
    },
  });

  if (!task) return false;

  // Check if any of the levels have a sprint belonging to a project where the user is a member
  const isDirectMember = (task.sprint?.project?.members?.length ?? 0) > 0;
  const isParentMember = (task.parentTask?.sprint?.project?.members?.length ?? 0) > 0;
  const isGrandparentMember = (task.parentTask?.parentTask?.sprint?.project?.members?.length ?? 0) > 0;

  return isDirectMember || isParentMember || isGrandparentMember;
}

export async function createTask(data: {
  sprintId?: string;
  title: string;
  description?: string;
  type: TaskType;
  assigneeId?: string;
  parentTaskId?: string;
  pushToGitHub?: boolean;
  requiredRole?: string;
  labels?: string[];
}) {
  // Runtime validation
  const validated = createTaskSchema.parse(data);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  let projectId: string | null = null;
  let projectMembers: { userId: string }[] = [];

  // Verify sprint access if sprintId is provided
  if (validated.sprintId) {
    const sprint = await db.sprint.findUnique({
      where: { id: validated.sprintId },
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
                  ...(validated.assigneeId ? [{ userId: validated.assigneeId }] : []),
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

  // If we have a projectId from sprint, check access
  if (projectId) {
    const hasAccess = isAdmin || projectMembers.some(m => m.userId === session.user.id);
    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    // Check assignee is project member (if assignee specified)
    if (validated.assigneeId && !isAdmin) {
      const assigneeIsMember = projectMembers.some(m => m.userId === validated.assigneeId);
      if (!assigneeIsMember) {
        throw new Error("Assignee not a project member");
      }
    }
  } else if (!isAdmin) {
    // No sprint — standalone task: allow any authenticated user
  }

  const { pushToGitHub, ...taskData } = validated;

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
    waitUntil(
      syncTaskToGitHub(task.id).catch(err => {
        console.error(`[Auto-Sync] Failed to sync new task ${task.id}:`, err);
      })
    );
  }

  return task;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, reviewerId?: string) {
  // Runtime validation
  const validatedStatus = updateTaskStatusSchema.parse({ taskId, newStatus, reviewerId });

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
      githubSyncedAt: new Date(),
      ...(newStatus === "review" && reviewerId ? { reviewerId } : {}),
    },
    include: {
      sprint: {
        select: { projectId: true },
      },
    },
  });

  // Only sync to GitHub if the task is linked to a GitHub issue
  if (updatedTask.githubIssueNumber) {
    waitUntil(
      syncTaskToGitHub(taskId).catch(err => {
        console.error(`[Auto-Sync] Failed to sync task ${taskId} to GitHub:`, err);
      })
    );
  }

  // Revalidate the project page to reflect the updated task status
  const revalidateProjectId = updatedTask.sprint?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  // Auto-recalculate parent ticket status if this is a subtask
  if (updatedTask.type === "subtask" && updatedTask.parentTaskId) {
    await recalculateTicketStatus(updatedTask.parentTaskId);
  }

  return updatedTask;
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    assigneeId?: string | null;
    requiredRole?: string;
    labels?: string[];
    dueAt?: Date | null;
    estimatedDuration?: number | null;
  }
) {
  // Runtime validation
  z.string().min(1).parse(taskId);
  const validatedData = updateTaskSchema.parse(data);

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
    data: validatedData,
    include: {
      sprint: {
        select: { projectId: true },
      },
    },
  });

  // Only sync to GitHub if the task is actually linked to a GitHub issue
  if (updatedTask.githubIssueNumber) {
    waitUntil(
      syncTaskToGitHub(taskId).catch(err => {
        console.error(`[Auto-Sync] Failed to sync updated task ${taskId}:`, err);
      })
    );
  }

  // Revalidate the project page to reflect the updated task
  const revalidateProjectId = updatedTask.sprint?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  return updatedTask;
}

export async function addComment(taskId: string, content: string) {
  // Runtime validation
  const validatedComment = createCommentSchema.parse({ taskId, content });

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.taskComment.create({
    data: {
      taskId: validatedComment.taskId,
      userId: session.user.id,
      content: validatedComment.content,
    },
  });
}

export async function getTaskComments(taskId: string) {
  // Runtime validation
  z.string().min(1).parse(taskId);

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
 * Includes parent task info, subtasks, comments count, and attachments count
 */
export async function getTaskWithProgress(taskId: string) {
  // Runtime validation
  z.string().min(1).parse(taskId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const task = await db.task.findUnique({
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
  // Runtime validation
  z.string().min(1).parse(taskId);

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
  const hasAccess = await canAccessTask(taskId, session.user.id, isAdmin);
  if (!hasAccess) throw new Error("Unauthorized");

  // Capture parentTaskId before deletion for recalculation
  const parentTaskId = task.parentTaskId;

  await db.task.delete({
    where: { id: taskId },
  });

  const revalidateProjectId = task.sprint?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  // Recalculate parent ticket status if this was a subtask
  if (parentTaskId) {
    await recalculateTicketStatus(parentTaskId);
  }

  return { success: true };
}

/**
 * Creates a subtask (child task) under a parent task.
 * Inherits sprintId from the parent task. Sets type to "subtask".
 * After creation, recalculates the parent ticket's status.
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
  // Runtime validation
  z.string().min(1).parse(parentTaskId);
  const validatedSubtask = createSubtaskSchema.parse(data);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  // Fetch the parent task to inherit sprintId
  const parentTask = await db.task.findUnique({
    where: { id: parentTaskId },
    select: {
      id: true,
      sprintId: true,
      sprint: {
        select: {
          projectId: true,
          project: {
            select: {
              members: {
                where: {
                  OR: [
                    { userId: session.user.id },
                    ...(validatedSubtask.assigneeId ? [{ userId: validatedSubtask.assigneeId }] : []),
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

  // Check access via sprint
  const projectMembers = parentTask.sprint?.project.members ?? [];

  const hasAccess = isAdmin || projectMembers.some(m => m.userId === session.user.id);
  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // Check assignee is project member (if specified)
  if (validatedSubtask.assigneeId && !isAdmin) {
    const assigneeIsMember = projectMembers.some(m => m.userId === validatedSubtask.assigneeId);
    if (!assigneeIsMember) {
      throw new Error("Assignee not a project member");
    }
  }

  // Create the subtask, inheriting sprint from parent
  const subtask = await db.task.create({
    data: {
      title: validatedSubtask.title,
      description: validatedSubtask.description,
      assigneeId: validatedSubtask.assigneeId,
      priority: validatedSubtask.priority ?? "medium",
      type: "subtask",
      sprintId: parentTask.sprintId,
      parentTaskId: parentTaskId,
      createdBy: session.user.id,
    },
  });

  // Revalidate cache
  const revalidateProjectId = parentTask.sprint?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  // Recalculate parent ticket status after adding a new subtask
  await recalculateTicketStatus(parentTaskId);

  return subtask;
}

export async function assignReviewer(taskId: string, reviewerId: string | null) {
  // Runtime validation
  z.string().min(1).parse(taskId);
  z.string().min(1).nullable().parse(reviewerId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const hasAccess = await canAccessTask(
    taskId,
    session.user.id,
    session.user.role === "admin"
  );
  if (!hasAccess) throw new Error("Unauthorized");

  const updatedTask = await db.task.update({
    where: { id: taskId },
    // reviewerId: null clears the reviewer; a valid string sets it
    data: { reviewerId: reviewerId ?? null },
    include: {
      sprint: { select: { projectId: true } },
    },
  });

  const revalidateProjectId = updatedTask.sprint?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  return updatedTask;
}

export async function getReviewTasks(userId: string) {
  // Runtime validation
  z.string().min(1).parse(userId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.task.findMany({
    where: {
      reviewerId: userId,
      status: "review",
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      type: true,
      requiredRole: true,
      sprint: {
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              name: true,
              vertical: { select: { id: true, name: true } },
            },
          },
        },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Creates a Story — a top-level task with type "story".
 * Admin only. Requires a sprintId. parentTaskId is always null.
 */
export async function createStory(data: {
  sprintId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  requiredRole?: string;
  labels?: string[];
}) {
  // Runtime validation
  const validated = createStorySchema.parse(data);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  // Verify sprint exists and get project info
  const sprint = await db.sprint.findUnique({
    where: { id: validated.sprintId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          id: true,
          members: {
            where: validated.assigneeId
              ? { userId: validated.assigneeId }
              : undefined,
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!sprint) throw new Error("Sprint not found");

  // If assignee is specified, verify they are a project member
  if (validated.assigneeId) {
    const assigneeIsMember = sprint.project.members.some(
      (m) => m.userId === validated.assigneeId
    );
    if (!assigneeIsMember) {
      throw new Error("Assignee not a project member");
    }
  }

  const story = await db.task.create({
    data: {
      title: validated.title,
      description: validated.description,
      type: "story",
      sprintId: validated.sprintId,
      assigneeId: validated.assigneeId,
      requiredRole: validated.requiredRole,
      labels: validated.labels ?? [],
      parentTaskId: null,
      createdBy: session.user.id,
    },
  });

  revalidatePath(`/projects/${sprint.projectId}`);

  return story;
}

/**
 * Creates a Ticket (task or bug) under a Story.
 * Admin or team member. Inherits sprintId from the parent story.
 */
export async function createTicket(data: {
  storyId: string;
  title: string;
  description?: string;
  type: "task" | "bug";
  priority?: TaskPriority;
  assigneeId?: string;
  requiredRole?: string;
  labels?: string[];
}) {
  // Runtime validation
  const validated = createTicketSchema.parse(data);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  // Fetch the parent story to inherit sprintId and check access
  const story = await db.task.findUnique({
    where: { id: validated.storyId },
    select: {
      id: true,
      type: true,
      sprintId: true,
      sprint: {
        select: {
          projectId: true,
          project: {
            select: {
              members: {
                where: {
                  OR: [
                    { userId: session.user.id },
                    ...(validated.assigneeId ? [{ userId: validated.assigneeId }] : []),
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

  if (!story) throw new Error("Story not found");
  if (story.type !== "story") throw new Error("Parent must be a story");
  if (!story.sprintId) throw new Error("Story must belong to a sprint");

  // Check access via sprint project membership
  const projectMembers = story.sprint?.project.members ?? [];
  const hasAccess = isAdmin || projectMembers.some(m => m.userId === session.user.id);
  if (!hasAccess) throw new Error("Unauthorized");

  // Check assignee is project member (if specified)
  if (validated.assigneeId && !isAdmin) {
    const assigneeIsMember = projectMembers.some(m => m.userId === validated.assigneeId);
    if (!assigneeIsMember) throw new Error("Assignee not a project member");
  }

  const ticket = await db.task.create({
    data: {
      title: validated.title,
      description: validated.description,
      type: validated.type,
      priority: validated.priority ?? "medium",
      assigneeId: validated.assigneeId,
      requiredRole: validated.requiredRole,
      labels: validated.labels ?? [],
      sprintId: story.sprintId,
      parentTaskId: validated.storyId,
      createdBy: session.user.id,
    },
  });

  // Auto-classify bug priority after creation (updates DB directly)
  if (validated.type === "bug" && !validated.priority && validated.description) {
    waitUntil(
      classifyBugPriority(ticket.id, validated.description!).catch(() => {
        // keep default priority on failure
      })
    );
  }

  const revalidateProjectId = story.sprint?.projectId;
  if (revalidateProjectId) {
    revalidatePath(`/projects/${revalidateProjectId}`);
  }

  return ticket;
}

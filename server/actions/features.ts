"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import {
  FeatureStatus,
  TaskPriority,
  TaskType,
} from "@prisma/client";
import { unstable_cache, revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeatureWithStats {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  priority: TaskPriority;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; name: string | null; email: string };
  taskCount: number;
  tasksByStatus: {
    todo: number;
    progress: number;
    review: number;
    done: number;
  };
  totalStoryPoints: number;
  completionPercentage: number;
}

export interface FeatureWithTasks {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: FeatureStatus;
  priority: TaskPriority;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; name: string | null; email: string };
  tasks: FeatureTask[];
  completionPercentage: number;
  totalStoryPoints: number;
}

export interface FeatureTask {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  requiredRole: string | null;
  labels: string[];
  sprintId: string | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  } | null;
  sprint: { id: string; name: string } | null;
  childTasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
  }[];
  _count: {
    comments: number;
  };
}

export interface FeatureProgressData {
  featureId: string;
  totalTasks: number;
  tasksByStatus: {
    todo: number;
    progress: number;
    review: number;
    done: number;
  };
  completionPercentage: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

// ─── Create Feature ──────────────────────────────────────────────────────────

export async function createFeature(data: {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Verify project exists
  const project = await db.project.findUnique({
    where: { id: data.projectId },
    select: { id: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const feature = await db.feature.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      priority: data.priority ?? TaskPriority.medium,
      status: FeatureStatus.backlog,
      createdBy: session.user.id,
    },
  });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath(`/projects/${data.projectId}/features`);

  return feature;
}

// ─── Update Feature ──────────────────────────────────────────────────────────

export async function updateFeature(
  featureId: string,
  data: {
    title?: string;
    description?: string;
    status?: FeatureStatus;
    priority?: TaskPriority;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const feature = await db.feature.findUnique({
    where: { id: featureId },
    select: { id: true, projectId: true },
  });

  if (!feature) {
    throw new Error("Feature not found");
  }

  const updated = await db.feature.update({
    where: { id: featureId },
    data,
  });

  revalidatePath(`/projects/${feature.projectId}`);
  revalidatePath(`/projects/${feature.projectId}/features`);

  return updated;
}

// ─── Delete Feature ──────────────────────────────────────────────────────────

export async function deleteFeature(featureId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const feature = await db.feature.findUnique({
    where: { id: featureId },
    select: { id: true, projectId: true },
  });

  if (!feature) {
    throw new Error("Feature not found");
  }

  // onDelete: SetNull on tasks will automatically unlink tasks from this feature
  await db.feature.delete({ where: { id: featureId } });

  revalidatePath(`/projects/${feature.projectId}`);
  revalidatePath(`/projects/${feature.projectId}/features`);

  return { success: true };
}

// ─── Get Project Features ────────────────────────────────────────────────────

export async function getProjectFeatures(
  projectId: string
): Promise<FeatureWithStats[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const getCachedProjectFeatures = unstable_cache(
    async (projectId: string) => {
      const features = await db.feature.findMany({
        where: { projectId },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          tasks: {
            select: {
              id: true,
              status: true,
              storyPoints: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return features.map((feature) => {
        const totalTasks = feature.tasks.length;
        const tasksByStatus = {
          todo: feature.tasks.filter((t) => t.status === "todo").length,
          progress: feature.tasks.filter((t) => t.status === "progress").length,
          review: feature.tasks.filter((t) => t.status === "review").length,
          done: feature.tasks.filter((t) => t.status === "done").length,
        };

        const completionPercentage =
          totalTasks > 0
            ? Math.round((tasksByStatus.done / totalTasks) * 100)
            : 0;

        const totalStoryPoints = feature.tasks.reduce(
          (sum, t) => sum + (t.storyPoints ?? 0),
          0
        );

        return {
          id: feature.id,
          projectId: feature.projectId,
          title: feature.title,
          description: feature.description,
          status: feature.status,
          priority: feature.priority,
          createdBy: feature.createdBy,
          createdAt: feature.createdAt,
          updatedAt: feature.updatedAt,
          creator: feature.creator,
          taskCount: totalTasks,
          tasksByStatus,
          totalStoryPoints,
          completionPercentage,
        };
      });
    },
    [`project-features-${projectId}`],
    {
      revalidate: 30,
    }
  );

  return getCachedProjectFeatures(projectId);
}

// ─── Get Feature With Tasks ──────────────────────────────────────────────────

export async function getFeatureWithTasks(
  featureId: string
): Promise<FeatureWithTasks | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const getCachedFeatureWithTasks = unstable_cache(
    async (featureId: string) => {
      const feature = await db.feature.findUnique({
        where: { id: featureId },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true, avatar: true },
              },
              sprint: {
                select: { id: true, name: true },
              },
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
                select: { comments: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!feature) return null;

      const totalTasks = feature.tasks.length;
      const doneTasks = feature.tasks.filter(
        (t) => t.status === "done"
      ).length;
      const completionPercentage =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      const totalStoryPoints = feature.tasks.reduce(
        (sum, t) => sum + (t.storyPoints ?? 0),
        0
      );

      return {
        id: feature.id,
        projectId: feature.projectId,
        title: feature.title,
        description: feature.description,
        status: feature.status,
        priority: feature.priority,
        createdBy: feature.createdBy,
        createdAt: feature.createdAt,
        updatedAt: feature.updatedAt,
        creator: feature.creator,
        tasks: feature.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          type: t.type,
          status: t.status,
          priority: t.priority,
          storyPoints: t.storyPoints,
          requiredRole: t.requiredRole,
          labels: t.labels,
          sprintId: t.sprintId,
          assignee: t.assignee,
          sprint: t.sprint,
          childTasks: t.childTasks,
          _count: t._count,
        })),
        completionPercentage,
        totalStoryPoints,
      };
    },
    [`feature-with-tasks-${featureId}`],
    {
      revalidate: 30,
    }
  );

  return getCachedFeatureWithTasks(featureId);
}

// ─── Get Feature Progress ────────────────────────────────────────────────────

export async function getFeatureProgress(
  featureId: string
): Promise<FeatureProgressData | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const getCachedFeatureProgress = unstable_cache(
    async (featureId: string) => {
      const feature = await db.feature.findUnique({
        where: { id: featureId },
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
              storyPoints: true,
            },
          },
        },
      });

      if (!feature) return null;

      const totalTasks = feature.tasks.length;
      const tasksByStatus = {
        todo: feature.tasks.filter((t) => t.status === "todo").length,
        progress: feature.tasks.filter((t) => t.status === "progress").length,
        review: feature.tasks.filter((t) => t.status === "review").length,
        done: feature.tasks.filter((t) => t.status === "done").length,
      };

      const completionPercentage =
        totalTasks > 0
          ? Math.round((tasksByStatus.done / totalTasks) * 100)
          : 0;

      const totalStoryPoints = feature.tasks.reduce(
        (sum, t) => sum + (t.storyPoints ?? 0),
        0
      );
      const completedStoryPoints = feature.tasks
        .filter((t) => t.status === "done")
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

      return {
        featureId: feature.id,
        totalTasks,
        tasksByStatus,
        completionPercentage,
        totalStoryPoints,
        completedStoryPoints,
      };
    },
    [`feature-progress-${featureId}`],
    {
      revalidate: 30,
    }
  );

  return getCachedFeatureProgress(featureId);
}

// ─── Add Task to Feature ─────────────────────────────────────────────────────

export async function addTaskToFeature(
  featureId: string,
  taskData: {
    title: string;
    description?: string;
    type: TaskType;
    priority?: TaskPriority;
    storyPoints?: number;
    requiredRole?: string;
    labels?: string[];
    assigneeId?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  // Fetch feature and verify it exists, also check project membership
  const feature = await db.feature.findUnique({
    where: { id: featureId },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          members: {
            where: { userId: session.user.id },
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!feature) {
    throw new Error("Feature not found");
  }

  // Check user has access (admin or project member)
  const hasAccess = isAdmin || feature.project.members.length > 0;
  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // Verify assignee is a project member if specified
  if (taskData.assigneeId) {
    const assigneeMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: feature.projectId,
          userId: taskData.assigneeId,
        },
      },
      select: { id: true },
    });

    if (!assigneeMember && !isAdmin) {
      throw new Error("Assignee is not a project member");
    }
  }

  // Create task linked to feature, no sprint yet
  const task = await db.task.create({
    data: {
      featureId,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      priority: taskData.priority ?? TaskPriority.medium,
      storyPoints: taskData.storyPoints,
      requiredRole: taskData.requiredRole,
      labels: taskData.labels ?? [],
      assigneeId: taskData.assigneeId,
      createdBy: session.user.id,
    },
  });

  revalidatePath(`/projects/${feature.projectId}`);
  revalidatePath(`/projects/${feature.projectId}/features`);

  return task;
}

// ─── Move Task to Sprint ─────────────────────────────────────────────────────

export async function moveTaskToSprint(taskId: string, sprintId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  // Fetch task to verify it exists
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      featureId: true,
      feature: {
        select: {
          projectId: true,
          project: {
            select: {
              members: {
                where: { userId: session.user.id },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Verify access
  const projectId = task.feature?.projectId;
  const hasAccess =
    isAdmin || (task.feature?.project.members.length ?? 0) > 0;
  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // Verify sprint exists and belongs to the same project
  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: { id: true, projectId: true },
  });

  if (!sprint) {
    throw new Error("Sprint not found");
  }

  if (projectId && sprint.projectId !== projectId) {
    throw new Error("Sprint must belong to the same project as the feature");
  }

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: { sprintId },
  });

  revalidatePath(`/projects/${sprint.projectId}`);
  revalidatePath(`/projects/${sprint.projectId}/features`);
  revalidatePath(`/projects/${sprint.projectId}/sprints`);

  return updatedTask;
}

// ─── Remove Task from Sprint ─────────────────────────────────────────────────

export async function removeTaskFromSprint(taskId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  // Fetch task with sprint info for revalidation
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      sprintId: true,
      sprint: {
        select: { projectId: true },
      },
      feature: {
        select: {
          projectId: true,
          project: {
            select: {
              members: {
                where: { userId: session.user.id },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (!task.sprintId) {
    throw new Error("Task is not assigned to a sprint");
  }

  // Verify access
  const hasAccess =
    isAdmin || (task.feature?.project.members.length ?? 0) > 0;
  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  const projectId =
    task.sprint?.projectId ?? task.feature?.projectId;

  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: { sprintId: null },
  });

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/features`);
    revalidatePath(`/projects/${projectId}/sprints`);
  }

  return updatedTask;
}

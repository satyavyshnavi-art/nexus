"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import {
  createGitHubIssue,
  updateGitHubIssue,
  closeGitHubIssue,
} from "@/lib/github/sync";

/**
 * Verifies that a user is a member of a project
 */
async function verifyProjectMembership(userId: string, projectId: string) {
  const membership = await db.projectMember.findFirst({
    where: {
      userId,
      project: { id: projectId },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this project");
  }
}

/**
 * Syncs a single task to GitHub (creates or updates issue)
 * @param taskId - Task ID to sync
 */
export async function syncTaskToGitHub(taskId: string) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // 2. Get task and project info
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      sprint: {
        include: {
          project: {
            select: {
              id: true,
              githubRepoOwner: true,
              githubRepoName: true,
              githubLinkedBy: true,
            },
          },
        },
      },
    },
  });

  if (!task) throw new Error("Task not found");

  const project = task.sprint.project;

  // 3. Check if project is linked to GitHub
  if (!project.githubRepoOwner || !project.githubRepoName) {
    throw new Error(
      "This project is not linked to a GitHub repository. Ask your admin to link one first."
    );
  }

  // 4. Get the GitHub token owner - prioritize: current user → project linker → system bot
  let syncUserId = session.user.id;

  // Check if current user has GitHub token
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { githubAccessToken: true },
  });

  if (!currentUser?.githubAccessToken) {
    // Fallback to project linker's token (the person who linked the repo)
    if (project.githubLinkedBy) {
      const linker = await db.user.findUnique({
        where: { id: project.githubLinkedBy },
        select: { githubAccessToken: true },
      });
      if (linker?.githubAccessToken) {
        syncUserId = project.githubLinkedBy;
      } else if (!process.env.GITHUB_ACCESS_TOKEN) {
        // No fallback available
        console.log(`[Auto-Sync] Skipping sync for task ${taskId}: no GitHub token available`);
        return { success: false, skipped: true };
      }
    } else if (!process.env.GITHUB_ACCESS_TOKEN) {
      console.log(`[Auto-Sync] Skipping sync for task ${taskId}: no GitHub token available`);
      return { success: false, skipped: true };
    }
  }

  try {
    let result;

    if (task.githubIssueNumber) {
      // Update existing issue
      result = await updateGitHubIssue(
        syncUserId,
        taskId,
        project.githubRepoOwner,
        project.githubRepoName
      );

      // Log sync
      await db.gitHubSyncLog.create({
        data: {
          taskId,
          projectId: project.id,
          action: "update",
          status: "success",
          githubIssueNumber: result.issueNumber,
          userId: syncUserId,
        },
      });
    } else {
      // Create new issue
      result = await createGitHubIssue(
        syncUserId,
        taskId,
        project.githubRepoOwner,
        project.githubRepoName
      );

      // Set githubStatus to open
      await db.task.update({
        where: { id: taskId },
        data: { githubStatus: "open" },
      });

      // Log sync
      await db.gitHubSyncLog.create({
        data: {
          taskId,
          projectId: project.id,
          action: "create",
          status: "success",
          githubIssueNumber: result.issueNumber,
          userId: syncUserId,
        },
      });
    }

    revalidatePath(`/projects/${project.id}`);

    return {
      success: true,
      issueNumber: result.issueNumber,
      issueUrl: result.issueUrl,
    };
  } catch (error: any) {
    // Log failure
    await db.gitHubSyncLog.create({
      data: {
        taskId,
        projectId: project.id,
        action: task.githubIssueNumber ? "update" : "create",
        status: "failed",
        errorMessage: error.message,
        userId: syncUserId,
      },
    });

    throw new Error(`Failed to sync task: ${error.message}`);
  }
}

/**
 * Batch syncs all unsynced tasks in a project (admin only)
 * @param projectId - Project ID
 */
export async function batchSyncTasksToGitHub(projectId: string) {
  // 1. Auth check - admin only for batch operations
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required for batch sync");
  }

  // 2. Get project
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      githubRepoOwner: true,
      githubRepoName: true,
      sprints: {
        where: { status: "active" },
        include: {
          tasks: {
            where: { githubIssueNumber: null }, // Only unsynced tasks
          },
        },
      },
    },
  });

  if (!project) throw new Error("Project not found");

  if (!project.githubRepoOwner || !project.githubRepoName) {
    throw new Error("Project is not linked to a GitHub repository");
  }

  // 3. Check user has GitHub account
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    throw new Error(
      "Please connect your GitHub account first. Sign out and sign in with GitHub."
    );
  }

  // 4. Collect all unsynced tasks
  const tasks = project.sprints.flatMap((sprint) => sprint.tasks);

  if (tasks.length === 0) {
    return {
      success: true,
      synced: 0,
      failed: 0,
      message: "No unsynced tasks found",
    };
  }

  // 5. Sync tasks with rate limiting
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const task of tasks) {
    try {
      await createGitHubIssue(
        session.user.id,
        task.id,
        project.githubRepoOwner,
        project.githubRepoName
      );

      await db.gitHubSyncLog.create({
        data: {
          taskId: task.id,
          projectId: project.id,
          action: "create",
          status: "success",
          userId: session.user.id,
        },
      });

      synced++;

      // Rate limiting: 1 second delay between syncs
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      await db.gitHubSyncLog.create({
        data: {
          taskId: task.id,
          projectId: project.id,
          action: "create",
          status: "failed",
          errorMessage: error.message,
          userId: session.user.id,
        },
      });

      failed++;
      errors.push(`Task "${task.title}": ${error.message}`);
    }
  }

  revalidatePath(`/projects/${projectId}`);

  return {
    success: true,
    synced,
    failed,
    total: tasks.length,
    errors: errors.slice(0, 5), // Only return first 5 errors
  };
}

/**
 * Gets sync status and recent logs for a project
 * @param projectId - Project ID
 */
export async function getProjectSyncStatus(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Get task counts
  const [syncedCount, unsyncedCount] = await Promise.all([
    db.task.count({
      where: {
        sprint: { projectId },
        githubIssueNumber: { not: null },
      },
    }),
    db.task.count({
      where: {
        sprint: { projectId },
        githubIssueNumber: null,
      },
    }),
  ]);

  // Get recent sync logs
  const recentLogs = await db.gitHubSyncLog.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      task: { select: { title: true } },
    },
  });

  return {
    synced: syncedCount,
    unsynced: unsyncedCount,
    total: syncedCount + unsyncedCount,
    recentLogs: recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      status: log.status,
      errorMessage: log.errorMessage,
      taskTitle: log.task?.title || "Unknown task",
      githubIssueNumber: log.githubIssueNumber,
      createdAt: log.createdAt,
    })),
  };
}

/**
 * Checks if a user can sync tasks (has GitHub account)
 */
export async function canSyncTasks() {
  const session = await auth();
  if (!session?.user) return false;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      githubAccessToken: true,
      githubUsername: true,
    },
  });

  return {
    canSync: !!user?.githubAccessToken,
    username: user?.githubUsername || null,
  };
}

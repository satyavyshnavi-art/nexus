import { TaskType, TaskPriority, TaskStatus } from "@prisma/client";
import { Octokit } from "@octokit/rest";
import { createOctokitForUser, createSystemOctokit } from "./client";
import { db } from "@/server/db";

/**
 * Gets an Octokit instance with fallback: user token → system token
 */
async function getOctokitWithFallback(userId: string): Promise<Octokit> {
  try {
    return await createOctokitForUser(userId);
  } catch {
    const systemOctokit = createSystemOctokit();
    if (systemOctokit) return systemOctokit;
    throw new Error("No GitHub token available. Connect GitHub or set GITHUB_ACCESS_TOKEN.");
  }
}

/**
 * Maps Nexus task properties to GitHub issue labels
 */
function generateLabels(task: {
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
}): string[] {
  const labels: string[] = [];

  // Type labels
  if (task.type === "bug") labels.push("bug");
  if (task.type === "story") labels.push("enhancement");
  if (task.type === "task") labels.push("task");

  // Priority labels
  if (task.priority === "critical") labels.push("priority: critical");
  if (task.priority === "high") labels.push("priority: high");
  if (task.priority === "medium") labels.push("priority: medium");
  if (task.priority === "low") labels.push("priority: low");

  // Status labels
  labels.push(`status: ${task.status}`);

  return labels;
}

/**
 * Gets the base URL for the Nexus app (used for image serving API routes)
 */
function getAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";
}

/**
 * Builds a screenshots markdown section using Nexus API image URLs.
 * Uses /api/attachments/[id]/image route which serves images directly,
 * so GitHub's camo proxy can fetch them (works for both public and private repos).
 */
async function buildScreenshotsSection(
  taskId: string
): Promise<string> {
  const attachments = await db.taskAttachment.findMany({
    where: { taskId },
  });

  const imageAttachments = attachments.filter((a) =>
    a.mimeType.startsWith("image/")
  );

  if (imageAttachments.length === 0) return "";

  const baseUrl = getAppBaseUrl();
  const imageLines = imageAttachments.map((att) => {
    const imageUrl = `${baseUrl}/api/attachments/${att.id}/image`;
    return `![${att.fileName}](${imageUrl})`;
  });

  return ["", "**Screenshots:**", ...imageLines].join("\n");
}

/**
 * Creates a GitHub issue from a Nexus task
 * @param userId - User performing the sync
 * @param taskId - Task to sync
 * @param repoOwner - Repository owner
 * @param repoName - Repository name
 */
export async function createGitHubIssue(
  userId: string,
  taskId: string,
  repoOwner: string,
  repoName: string
) {
  // Get task details
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { name: true, githubUsername: true } },
      creator: { select: { name: true } },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.githubIssueNumber) {
    throw new Error("Task is already synced to GitHub issue #" + task.githubIssueNumber);
  }

  // Create GitHub issue
  let octokit;
  let usedTokenSource = "creator";

  try {
    // Strategy 1: Try Creator's Token
    octokit = await createOctokitForUser(userId);
  } catch (error) {
    console.log(`[GitHub Sync] Creator (ID: ${userId}) has no GitHub token. Trying fallbacks...`);

    // Strategy 2: System Bot Token (from ENV)
    if (process.env.GITHUB_ACCESS_TOKEN) {
      console.log(`[GitHub Sync] Using System Bot Token.`);
      const { Octokit } = await import("@octokit/rest");
      octokit = new Octokit({
        auth: process.env.GITHUB_ACCESS_TOKEN,
        userAgent: 'Nexus-PM/1.0.0-Bot',
      });
      usedTokenSource = "system";
    }
    // Strategy 3: Assignee's Token
    else if (task.assignee?.githubUsername) {
      console.log(`[GitHub Sync] Trying Assignee's Token (${task.assignee.githubUsername}).`);
      // We need to find the assignee's User ID to get their token
      // This is a bit of a lookup since we only have the username on the task relation sometimes
      // Better to look up the assignee by ID from the task
      const assigneeUser = await db.user.findUnique({
        where: { id: task.assigneeId! },
        select: { id: true }
      });

      if (assigneeUser) {
        try {
          octokit = await createOctokitForUser(assigneeUser.id);
          usedTokenSource = "assignee";
        } catch (assigneeError) {
          console.log(`[GitHub Sync] Assignee also has no token.`);
        }
      }
    }
  }

  if (!octokit) {
    throw new Error("No valid GitHub token found (checked Creator, System, and Assignee). Cannot sync to GitHub.");
  }

  // Build issue body
  const bodyParts = [
    task.description || "_No description provided_",
    "",
    "---",
    `**Created in Nexus by:** ${task.creator.name}`,
  ];

  bodyParts.push(`**Task ID:** \`${task.id}\``);

  // Build image attachments section using Nexus API URLs
  const screenshotsSection = await buildScreenshotsSection(taskId);

  const body = bodyParts.join("\n") + screenshotsSection;

  // Create the issue
  try {
    const { data: issue } = await octokit.rest.issues.create({
      owner: repoOwner,
      repo: repoName,
      title: task.title,
      body,
      labels: generateLabels(task),
      assignees: task.assignee?.githubUsername ? [task.assignee.githubUsername] : undefined,
    });

    // Update task with GitHub issue info
    await db.task.update({
      where: { id: taskId },
      data: {
        githubIssueNumber: issue.number,
        githubIssueId: BigInt(issue.id),
        githubUrl: issue.html_url,
        githubSyncedAt: new Date(),
      },
    });

    return {
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      issueId: issue.id,
    };
  } catch (error: any) {
    if (error.status === 422) {
      throw new Error(
        "Failed to create issue: Invalid data. Check that assignee has access to the repository."
      );
    }
    throw new Error(`Failed to create GitHub issue: ${error.message}`);
  }
}

/**
 * Updates an existing GitHub issue with current task data
 * @param userId - User performing the sync
 * @param taskId - Task to sync
 * @param repoOwner - Repository owner
 * @param repoName - Repository name
 */
export async function updateGitHubIssue(
  userId: string,
  taskId: string,
  repoOwner: string,
  repoName: string
) {
  // Get task details
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { name: true, githubUsername: true } },
    },
  });

  if (!task || !task.githubIssueNumber) {
    throw new Error("Task is not synced to GitHub");
  }

  const octokit = await getOctokitWithFallback(userId);

  // Build updated issue body
  const bodyParts = [
    task.description || "_No description provided_",
    "",
    "---",
  ];

  bodyParts.push(`**Task ID:** \`${task.id}\``);
  bodyParts.push(`**Nexus Status:** \`${task.status}\``);
  bodyParts.push(`**Last synced:** ${new Date().toISOString()}`);

  // Build image attachments section using Nexus API URLs
  const screenshotsSection = await buildScreenshotsSection(taskId);

  const body = bodyParts.join("\n") + screenshotsSection;

  // Determine if issue should be closed
  // Close if task is "done" or "review" (dev closed it, waiting for verification)
  // Open for "todo" and "progress"
  const state = (task.status === "done" || task.status === "review") ? "closed" : "open";

  // Update the issue
  try {
    const { data: issue } = await octokit.rest.issues.update({
      owner: repoOwner,
      repo: repoName,
      issue_number: task.githubIssueNumber,
      title: task.title,
      body,
      labels: generateLabels(task),
      state,
      assignees: task.assignee?.githubUsername ? [task.assignee.githubUsername] : undefined,
    });

    // Update sync timestamp
    await db.task.update({
      where: { id: taskId },
      data: {
        githubSyncedAt: new Date(),
        githubUrl: issue.html_url,
      },
    });

    return {
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      state: issue.state,
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(
        "GitHub issue not found. It may have been deleted. Try unlinking and re-syncing."
      );
    }
    throw new Error(`Failed to update GitHub issue: ${error.message}`);
  }
}

/**
 * Closes a GitHub issue (used when task is completed)
 * @param userId - User performing the sync
 * @param taskId - Task to close
 * @param repoOwner - Repository owner
 * @param repoName - Repository name
 */
export async function closeGitHubIssue(
  userId: string,
  taskId: string,
  repoOwner: string,
  repoName: string
) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { githubIssueNumber: true },
  });

  if (!task || !task.githubIssueNumber) {
    throw new Error("Task is not synced to GitHub");
  }

  const octokit = await getOctokitWithFallback(userId);

  try {
    await octokit.rest.issues.update({
      owner: repoOwner,
      repo: repoName,
      issue_number: task.githubIssueNumber,
      state: "closed",
    });

    await db.task.update({
      where: { id: taskId },
      data: { githubSyncedAt: new Date() },
    });
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error("GitHub issue not found. It may have been deleted.");
    }
    throw new Error(`Failed to close GitHub issue: ${error.message}`);
  }
}

/**
 * Deletes a GitHub issue permanently (used when task is deleted from Nexus).
 * Uses GraphQL API since REST API doesn't support issue deletion.
 * Requires admin permissions on the repo.
 */
export async function deleteGitHubIssue(
  userId: string,
  taskId: string,
  repoOwner: string,
  repoName: string
) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { githubIssueNumber: true },
  });

  if (!task || !task.githubIssueNumber) {
    throw new Error("Task is not synced to GitHub");
  }

  const octokit = await getOctokitWithFallback(userId);

  try {
    // First get the issue's node_id (needed for GraphQL deletion)
    const { data: issue } = await octokit.rest.issues.get({
      owner: repoOwner,
      repo: repoName,
      issue_number: task.githubIssueNumber,
    });

    // Delete via GraphQL
    await octokit.graphql(
      `mutation($issueId: ID!) {
        deleteIssue(input: { issueId: $issueId }) {
          repository {
            name
          }
        }
      }`,
      { issueId: issue.node_id }
    );
  } catch (error: any) {
    if (error.status === 404) {
      // Issue already gone — that's fine
      return;
    }
    // If GraphQL delete fails (e.g. no admin perms), fall back to closing
    console.error(`[GitHub Sync] Failed to delete issue, falling back to close:`, error.message);
    try {
      await octokit.rest.issues.update({
        owner: repoOwner,
        repo: repoName,
        issue_number: task.githubIssueNumber!,
        state: "closed",
      });
    } catch {
      // Best effort — don't block task deletion
    }
  }
}

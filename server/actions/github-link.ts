"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { verifyRepositoryAccess, createOctokitForUser } from "@/lib/github/client";
import { z } from "zod";

const linkRepoSchema = z.object({
  projectId: z.string().uuid(),
  repoOwner: z.string().min(1).max(100),
  repoName: z.string().min(1).max(100),
});

/**
 * Links a GitHub repository to a Nexus project (admin only)
 * @param projectId - Project ID
 * @param repoOwner - GitHub repository owner
 * @param repoName - GitHub repository name
 */
export async function linkGitHubRepository(
  projectId: string,
  repoOwner: string,
  repoName: string
) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required to link repositories");
  }

  // 2. Validate inputs
  const data = linkRepoSchema.parse({ projectId, repoOwner, repoName });

  // 3. Verify user has GitHub account
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    throw new Error(
      "Please connect your GitHub account first. Sign out and sign in with GitHub."
    );
  }

  // 4. Verify repository exists and user has access
  await verifyRepositoryAccess(session.user.id, data.repoOwner, data.repoName);

  // 5. Get repository ID from GitHub
  const octokit = await createOctokitForUser(session.user.id);
  const { data: repo } = await octokit.rest.repos.get({
    owner: data.repoOwner,
    repo: data.repoName,
  });

  // 6. Verify project exists
  const project = await db.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // 7. Link repository
  await db.project.update({
    where: { id: data.projectId },
    data: {
      githubRepoOwner: data.repoOwner,
      githubRepoName: data.repoName,
      githubRepoId: BigInt(repo.id),
      githubLinkedBy: session.user.id,
      githubLinkedAt: new Date(),
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects`);

  return {
    success: true,
    repository: `${data.repoOwner}/${data.repoName}`,
    repositoryUrl: repo.html_url,
  };
}

/**
 * Unlinks a GitHub repository from a Nexus project (admin only)
 * @param projectId - Project ID
 */
export async function unlinkGitHubRepository(projectId: string) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required to unlink repositories");
  }

  // 2. Verify project exists
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // 3. Unlink repository
  await db.project.update({
    where: { id: projectId },
    data: {
      githubRepoOwner: null,
      githubRepoName: null,
      githubRepoId: null,
      githubLinkedBy: null,
      githubLinkedAt: null,
    },
  });

  // Note: We don't delete existing sync logs or update tasks
  // This preserves the sync history for audit purposes

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects`);

  return { success: true };
}

/**
 * Gets linked repository information for a project
 * @param projectId - Project ID
 */
export async function getLinkedRepository(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubRepoOwner: true,
      githubRepoName: true,
      githubLinkedAt: true,
      linkedByUser: {
        select: {
          name: true,
          githubUsername: true,
        },
      },
    },
  });

  if (!project?.githubRepoOwner) {
    return null;
  }

  return {
    repository: `${project.githubRepoOwner}/${project.githubRepoName}`,
    repositoryUrl: `https://github.com/${project.githubRepoOwner}/${project.githubRepoName}`,
    owner: project.githubRepoOwner,
    name: project.githubRepoName,
    linkedAt: project.githubLinkedAt,
    linkedBy: project.linkedByUser?.name || "Unknown",
    linkedByGitHub: project.linkedByUser?.githubUsername,
  };
}

/**
 * Checks if current user has GitHub account connected
 */
export async function hasGitHubAccount() {
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
    hasAccount: !!user?.githubAccessToken,
    username: user?.githubUsername || null,
  };
}

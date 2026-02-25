"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { verifyRepositoryAccess, createOctokitForUser, getRepository, listOrgRepositories } from "@/lib/github/client";
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
  // 1. Auth check - allow any authenticated user (membership verified below)
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to link repositories");
  }

  // 2. Validate inputs
  const data = linkRepoSchema.parse({ projectId, repoOwner, repoName });

  // 3. Verify user is admin or a member of this project
  const isAdmin = session.user.role === "admin";
  if (!isAdmin) {
    const membership = await db.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: data.projectId, userId: session.user.id },
      },
    });
    if (!membership) {
      throw new Error("Unauthorized: You must be a member of this project to link a repository");
    }
  }

  // NOTE: We do NOT strictly check for user.githubAccessToken here anymore.
  // The 'verifyRepositoryAccess' and 'getRepository' functions now handle the fallback
  // to a system token if the user doesn't have one connected.

  // 4. Verify repository exists and user (or system) has access
  await verifyRepositoryAccess(session.user.id, data.repoOwner, data.repoName);

  // 5. Get repository ID from GitHub (uses fallback if needed)
  const repo = await getRepository(session.user.id, data.repoOwner, data.repoName);

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

export interface OrgRepo {
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  description: string | null;
  updatedAt: string;
}

/**
 * Fetches repositories from the configured GitHub org
 */
export async function getOrgRepos(): Promise<{ repos: OrgRepo[] } | { error: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const orgName = process.env.GITHUB_ORG_NAME;
  if (!orgName) {
    return { error: "GitHub organization not configured" };
  }

  try {
    const repos = await listOrgRepositories(orgName);
    return {
      repos: repos.map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        isPrivate: repo.private,
        description: repo.description ?? null,
        updatedAt: repo.updated_at ?? "",
      })),
    };
  } catch (error: any) {
    if (error.status === 404) {
      return { error: "Organization not found or no access" };
    }
    return { error: error.message || "Failed to fetch repositories" };
  }
}

import { Octokit } from "@octokit/rest";
import { db } from "@/server/db";
import { decrypt } from "@/lib/crypto/encryption";

/**
 * Creates an authenticated Octokit instance for a user
 * @param userId - The user's ID
 * @returns Authenticated Octokit instance
 * @throws Error if user doesn't have a GitHub account connected
 */
export async function createOctokitForUser(userId: string): Promise<Octokit> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      githubAccessToken: true,
      githubUsername: true,
    },
  });

  if (!user?.githubAccessToken) {
    throw new Error("GitHub account not connected. Please sign in with GitHub first.");
  }

  // Decrypt the access token
  const token = decrypt(user.githubAccessToken);

  return new Octokit({
    auth: token,
    userAgent: 'Nexus-PM/1.0.0',
  });
}

/**
 * Verifies that a user has access to a specific repository
 * @param userId - The user's ID
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @returns true if user has access
 * @throws Error if repository not found or access denied
 */
export async function verifyRepositoryAccess(
  userId: string,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const octokit = await createOctokitForUser(userId);

    // Try to get the repository - this will fail if no access
    await octokit.rest.repos.get({ owner, repo });

    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(
        `Repository "${owner}/${repo}" not found or you don't have access to it. ` +
        "Make sure the repository exists and you have the necessary permissions."
      );
    }
    if (error.status === 403) {
      throw new Error(
        "GitHub API rate limit exceeded or access forbidden. Please try again later."
      );
    }
    throw new Error(`Failed to verify repository access: ${error.message}`);
  }
}

/**
 * Gets repository information
 * @param userId - The user's ID
 * @param owner - Repository owner username
 * @param repo - Repository name
 * @returns Repository data
 */
export async function getRepository(userId: string, owner: string, repo: string) {
  const octokit = await createOctokitForUser(userId);
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

/**
 * Lists repositories accessible to the user
 * @param userId - The user's ID
 * @param options - Filter options
 * @returns List of repositories
 */
export async function listUserRepositories(
  userId: string,
  options: {
    visibility?: "all" | "public" | "private";
    affiliation?: string;
    sort?: "created" | "updated" | "pushed" | "full_name";
    per_page?: number;
  } = {}
) {
  const octokit = await createOctokitForUser(userId);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    visibility: options.visibility || "all",
    affiliation: options.affiliation || "owner,collaborator,organization_member",
    sort: options.sort || "updated",
    per_page: options.per_page || 30,
  });
  return data;
}

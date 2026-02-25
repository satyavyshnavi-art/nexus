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
 * Creates an authenticated Octokit instance using the system token (if available)
 */
export function createSystemOctokit(): Octokit | null {
  if (!process.env.GITHUB_ACCESS_TOKEN) {
    return null;
  }
  return new Octokit({
    auth: process.env.GITHUB_ACCESS_TOKEN,
    userAgent: 'Nexus-PM/1.0.0',
  });
}

/**
 * Verifies that a user has access to a specific repository
 * Fallbacks to system token for public repositories check if user token is missing
 */
export async function verifyRepositoryAccess(
  userId: string,
  owner: string,
  repo: string
): Promise<boolean> {
  let octokit: Octokit;

  try {
    octokit = await createOctokitForUser(userId);
  } catch (error) {
    // If user has no token, try system fallback
    const systemOctokit = createSystemOctokit();
    if (!systemOctokit) {
      throw error; // Re-throw "please sign in" if no system token either
    }
    octokit = systemOctokit;
  }

  try {
    await octokit.rest.repos.get({ owner, repo });
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(
        `Repository "${owner}/${repo}" not found or access denied. ` +
        "Make sure the repository exists and is public (or you have access)."
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
 * Gets repository information with fallback
 */
export async function getRepository(userId: string, owner: string, repo: string) {
  let octokit: Octokit;

  try {
    octokit = await createOctokitForUser(userId);
  } catch (error) {
    const systemOctokit = createSystemOctokit();
    if (!systemOctokit) throw error;
    octokit = systemOctokit;
  }

  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

/**
 * Lists repositories for a GitHub organization
 * Uses pagination to handle orgs with >100 repos
 */
export async function listOrgRepositories(
  userId: string,
  org: string
) {
  const octokit = await createOctokitForUser(userId);
  const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
    org,
    sort: "updated",
    per_page: 100,
  });
  return repos;
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

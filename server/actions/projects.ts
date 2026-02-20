"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { unstable_cache, revalidatePath } from "next/cache";

export async function createProject(data: {
  name: string;
  description?: string;
  verticalId: string;
  initialMemberIds?: string[];
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const { initialMemberIds = [], ...projectData } = data;

  // Always include the creator as a member
  const memberIds = new Set([session.user.id, ...initialMemberIds]);

  const project = await db.project.create({
    data: {
      ...projectData,
      createdBy: session.user.id,
      members: {
        create: Array.from(memberIds).map((userId) => ({
          userId,
        })),
      },
    },
    select: { id: true, name: true },
  });

  // Revalidate caches
  revalidatePath("/admin/projects");
  revalidatePath("/admin/verticals");
  revalidatePath(`/admin/verticals/${data.verticalId}`);

  return { id: project.id, name: project.name };
}

export async function getProjectsByVertical(verticalId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  const projects = await db.project.findMany({
    where: {
      verticalId,
      ...(isAdmin
        ? {}
        : {
          members: {
            some: { userId: session.user.id },
          },
        }),
    },
    include: {
      _count: {
        select: { sprints: true, members: true },
      },
    },
  });

  return projects.map(project => ({
    ...project,
    githubRepoId: project.githubRepoId ? project.githubRepoId.toString() : null,
  }));
}

export async function getProject(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Cached query - 30 second cache per project
  const getCachedProject = unstable_cache(
    async (projectId: string) => {
      return db.project.findUnique({
        where: { id: projectId },
        include: {
          vertical: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, designation: true },
              },
            },
          },
          _count: {
            select: { sprints: true },
          },
        },
        // Note: GitHub fields (githubRepoOwner, githubRepoName, etc.) are included by default
      });
    },
    [`project-${projectId}`],
    {
      revalidate: 30,
      tags: [`project-${projectId}`, "projects"],
    }
  );

  const project = await getCachedProject(projectId);

  if (!project) throw new Error("Project not found");

  // Check access
  const isAdmin = session.user.role === "admin";
  const isMember = project.members.some((m) => m.userId === session.user.id);

  if (!isAdmin && !isMember) {
    throw new Error("Unauthorized");
  }

  // Serialize BigInt for client components (just in case it's passed)
  return {
    ...project,
    githubRepoId: project.githubRepoId?.toString() || null,
  };
}

export async function addMemberToProject(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Verify user belongs to project's vertical -> REMOVED to allow cross-vertical assignment
  // const project = await db.project.findUnique({
  //   where: { id: projectId },
  //   include: { vertical: { include: { users: true } } },
  // });

  // const userInVertical = project?.vertical.users.some(
  //   (vu) => vu.userId === userId
  // );
  // if (!userInVertical) {
  //   throw new Error("User not in project vertical");
  // }

  const result = await db.projectMember.upsert({
    where: {
      projectId_userId: { projectId, userId },
    },
    create: { projectId, userId },
    update: {},
  });

  // Revalidate caches
  const { revalidatePath, revalidateTag } = await import("next/cache");
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/team");
  // @ts-expect-error - Next.js 15 type mismatch in local environment
  revalidateTag("team-stats");
  // @ts-expect-error - Next.js 15 type mismatch in local environment
  revalidateTag("team-members");

  return result;
}

export async function removeMemberFromProject(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const result = await db.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  // Revalidate caches
  const { revalidatePath, revalidateTag } = await import("next/cache");
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/team");
  // @ts-expect-error - Next.js 15 type mismatch in local environment
  revalidateTag("team-stats");
  // @ts-expect-error - Next.js 15 type mismatch in local environment
  revalidateTag("team-members");

  return result;
}

export async function getAllProjects() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Cached query - 30 second cache for admin projects list
  const getCachedAllProjects = unstable_cache(
    async () => {
      const projects = await db.project.findMany({
        include: {
          vertical: {
            select: { id: true, name: true },
          },
          _count: {
            select: { sprints: true, members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return projects.map(project => ({
        ...project,
        githubRepoId: project.githubRepoId ? project.githubRepoId.toString() : null,
      }));
    },
    ["all-projects"],
    {
      revalidate: 30, // Cache for 30 seconds
      tags: ["projects"],
    }
  );

  return getCachedAllProjects();
}

// Optimized: Get all user projects in ONE query (fixes N+1)
export async function getUserProjects() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";


  // Cached query - 30 second cache per user
  const getCachedProjects = unstable_cache(
    async (userId: string, isAdmin: boolean) => {
      const results = await db.project.findMany({
        where: isAdmin
          ? {}
          : {
            // Get projects where user is explicitly a member
            members: {
              some: { userId },
            },
          },
        include: {
          vertical: {
            select: { id: true, name: true },
          },
          _count: {
            select: { sprints: true, members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return results.map(project => ({
        ...project,
        githubRepoId: project.githubRepoId ? project.githubRepoId.toString() : null,
      }));
    },
    [`user-projects-${session.user.id}-v2`], // Force cache bust with v2
    {
      revalidate: 10, // Lower cache time to 10s for debugging
      tags: [`user-${session.user.id}-projects`, "projects"],
    }
  );

  return getCachedProjects(session.user.id, isAdmin);
}

export async function getProjectMemberData(projectId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Fetch project with all necessary data in one query
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      vertical: {
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Extract current member user IDs for filtering
  const currentMemberIds = new Set(project.members.map((m) => m.userId));

  // Filter available users (not in project)
  // OPTIMIZATION: Fetch all users if admin, or keep vertical restriction? 
  // For now, fetching all users to fix the "can't see new user" issue.
  const allUsers = await db.user.findMany({
    where: {
      NOT: {
        id: { in: Array.from(currentMemberIds) }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
    }
  });

  const availableUsers = allUsers;

  // Extract current members
  const currentMembers = project.members.map((m) => m.user);

  return {
    project: {
      id: project.id,
      name: project.name,
      verticalId: project.verticalId,
    },
    verticalName: project.vertical.name,
    currentMembers,
    availableUsers,
  };
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  try {
    const project = await db.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/");
    revalidatePath("/admin/projects");
    revalidatePath("/admin/verticals");
    return project;
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw new Error("Failed to delete project");
  }
}

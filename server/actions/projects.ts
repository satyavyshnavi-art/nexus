"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createProjectSchema } from "@/lib/validation/schemas";

export async function createProject(data: {
  name: string;
  description?: string;
  verticalId: string;
  initialMemberIds?: string[];
}) {
  // Runtime validation
  const validated = createProjectSchema.parse(data);

  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const { initialMemberIds = [], ...projectData } = validated;

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
  revalidatePath(`/admin/verticals/${validated.verticalId}`);

  return { id: project.id, name: project.name };
}

export async function getProjectsByVertical(verticalId: string) {
  // Runtime validation
  z.string().min(1).parse(verticalId);

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
  // Runtime validation
  z.string().min(1).parse(projectId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const project = await db.project.findUnique({
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
  });

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
  // Runtime validation
  z.string().min(1).parse(projectId);
  z.string().min(1).parse(userId);

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
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/team");

  return result;
}

export async function removeMemberFromProject(projectId: string, userId: string) {
  // Runtime validation
  z.string().min(1).parse(projectId);
  z.string().min(1).parse(userId);

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
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/admin/projects");
  revalidatePath("/team");

  return result;
}

export async function getAllProjects() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

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
}

// Optimized: Get all user projects in ONE query (fixes N+1)
export async function getUserProjects() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";
  const userId = session.user.id;

  const results = await db.project.findMany({
    where: isAdmin
      ? {}
      : {
        members: {
          some: { userId },
        },
      },
    include: {
      vertical: {
        select: { id: true, name: true },
      },
      members: {
        select: { userId: true },
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
}

export async function getProjectMemberData(projectId: string) {
  // Runtime validation
  z.string().min(1).parse(projectId);

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
  // Runtime validation
  z.string().min(1).parse(projectId);

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

/**
 * Get a project by ID — skips auth() for use when the page already has the session.
 * This avoids a redundant DB round-trip for auth.
 */
export async function getProjectCached(
  projectId: string,
  userId: string,
  userRole: string
) {
  // Runtime validation
  z.string().min(1).parse(projectId);
  z.string().min(1).parse(userId);
  z.string().min(1).parse(userRole);

  const project = await db.project.findUnique({
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
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: { sprints: true },
      },
    },
  });
  if (!project) throw new Error("Project not found");

  const isAdmin = userRole === "admin";
  const isMember = project.members.some((m) => m.userId === userId);
  if (!isAdmin && !isMember) throw new Error("Unauthorized");

  return {
    ...project,
    githubRepoId: project.githubRepoId?.toString() || null,
  };
}

/**
 * Get user projects — skips auth() for use when the page already has the session.
 */
export async function getUserProjectsCached(userId: string, isAdmin: boolean) {
  // Runtime validation
  z.string().min(1).parse(userId);
  z.boolean().parse(isAdmin);

  const results = await db.project.findMany({
    where: isAdmin
      ? {}
      : { members: { some: { userId } } },
    include: {
      vertical: { select: { id: true, name: true } },
      members: { select: { userId: true } },
      _count: { select: { sprints: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return results.map((project) => ({
    ...project,
    githubRepoId: project.githubRepoId
      ? project.githubRepoId.toString()
      : null,
  }));
}

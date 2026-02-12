"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";

export async function createProject(data: {
  name: string;
  description?: string;
  verticalId: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const project = await db.project.create({
    data: {
      ...data,
      createdBy: session.user.id,
    },
  });

  // Revalidate caches
  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidateTag("projects");

  return project;
}

export async function getProjectsByVertical(verticalId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  return db.project.findMany({
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
                select: { id: true, name: true, email: true },
              },
            },
          },
          _count: {
            select: { sprints: true },
          },
        },
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

  return project;
}

export async function addMemberToProject(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Verify user belongs to project's vertical
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { vertical: { include: { users: true } } },
  });

  const userInVertical = project?.vertical.users.some(
    (vu) => vu.userId === userId
  );
  if (!userInVertical) {
    throw new Error("User not in project vertical");
  }

  const result = await db.projectMember.upsert({
    where: {
      projectId_userId: { projectId, userId },
    },
    create: { projectId, userId },
    update: {},
  });

  // Revalidate caches
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidateTag(`project-${projectId}`);
  revalidateTag("projects");

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
  revalidatePath("/");
  revalidatePath(`/projects/${projectId}`);
  revalidateTag(`project-${projectId}`);
  revalidateTag("projects");

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
      return db.project.findMany({
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
      return db.project.findMany({
        where: isAdmin
          ? {}
          : {
              // Get projects where user is a member through vertical OR project membership
              OR: [
                {
                  vertical: {
                    users: {
                      some: { userId },
                    },
                  },
                },
                {
                  members: {
                    some: { userId },
                  },
                },
              ],
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
    },
    [`user-projects`],
    {
      revalidate: 30, // Cache for 30 seconds
    }
  );

  return getCachedProjects(session.user.id, isAdmin);
}

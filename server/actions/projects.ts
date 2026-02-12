"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";

export async function createProject(data: {
  name: string;
  description?: string;
  verticalId: string;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.project.create({
    data: {
      ...data,
      createdBy: session.user.id,
    },
  });
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

  const project = await db.project.findUnique({
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

  return db.projectMember.upsert({
    where: {
      projectId_userId: { projectId, userId },
    },
    create: { projectId, userId },
    update: {},
  });
}

export async function removeMemberFromProject(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
    },
  });
}

export async function getAllProjects() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

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
}

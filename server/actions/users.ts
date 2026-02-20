"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { UserRole } from "@prisma/client";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export async function getAllUsers() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { role },
  });

  const { revalidatePath, revalidateTag } = await import("next/cache");
  revalidatePath("/");
  revalidatePath("/admin/verticals");
  revalidatePath("/team");
  revalidatePath("/admin/users");

  // @ts-expect-error - Next.js 15
  revalidateTag("all-users");
  // @ts-expect-error - Next.js 15
  revalidateTag("team-stats");
  // @ts-expect-error - Next.js 15
  revalidateTag("team-members");

  return updated;
}

/**
 * Get user profile with stats (cached 30s)
 * Includes user info, task counts, and project memberships
 */
export async function getUserProfile(userId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only allow users to view their own profile or admins to view any profile
  if (session.user.id !== userId && session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  const getCachedProfile = unstable_cache(
    async (id: string) => {
      return db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          bio: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              createdTasks: true,
              assignedTasks: true,
              comments: true,
              projectMemberships: true,
            },
          },
        },
      });
    },
    ["user-profile"],
    {
      revalidate: 30, // Cache for 30 seconds
      tags: [`user-profile-${userId}`],
    }
  );

  const profile = await getCachedProfile(userId);
  if (!profile) {
    throw new Error("User not found");
  }

  return profile;
}

/**
 * Update user profile fields (designation, bio, avatar)
 * Only user themselves or admins can update
 */
export async function updateUserProfile(
  userId: string,
  data: {
    designation?: string;
    bio?: string;
    avatar?: string;
  }
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only allow users to update their own profile or admins to update any profile
  if (session.user.id !== userId && session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  // Validate input
  if (data.designation !== undefined && data.designation !== null && data.designation.length > 255) {
    throw new Error("Designation must be 255 characters or less");
  }

  if (data.bio !== undefined && data.bio !== null && data.bio.length > 1000) {
    throw new Error("Bio must be 1000 characters or less");
  }

  if (data.avatar !== undefined && data.avatar !== null && data.avatar.length > 2048) {
    throw new Error("Avatar URL must be 2048 characters or less");
  }

  const { designation, bio, avatar } = data;

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      ...(designation !== undefined && { designation }),
      ...(bio !== undefined && { bio }),
      ...(avatar !== undefined && { avatar }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      bio: true,
      avatar: true,
      role: true,
      updatedAt: true,
    },
  });

  // Revalidate caches
  revalidatePath(`/profile/${userId}`);
  revalidatePath("/team");
  revalidatePath("/");

  return updated;
}

/**
 * Get current user's profile with detailed stats and recent activity
 */
export async function getCurrentUserProfile() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      bio: true,
      avatar: true,
      role: true,
      createdAt: true,
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          createdAt: true,
          sprint: {
            select: {
              name: true,
              project: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      projectMemberships: {
        select: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Calculate statistics
  const totalTasks = await db.task.count({
    where: { assigneeId: session.user.id },
  });

  const completedTasks = await db.task.count({
    where: {
      assigneeId: session.user.id,
      status: "done",
    },
  });

  const activeProjects = user.projectMemberships.length;

  return {
    ...user,
    stats: {
      totalTasks,
      completedTasks,
      activeProjects,
    },
  };
}

export async function getMyTasksAndProjects() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;

  const [assignedTasks, projectMemberships, totalTasks, completedTasks] =
    await Promise.all([
      db.task.findMany({
        where: { assigneeId: userId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          requiredRole: true,
          labels: true,
          storyPoints: true,
          createdAt: true,
          sprint: {
            select: {
              id: true,
              name: true,
              status: true,
              project: {
                select: {
                  id: true,
                  name: true,
                  vertical: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.projectMember.findMany({
        where: { userId },
        select: {
          project: {
            select: {
              id: true,
              name: true,
              vertical: {
                select: { id: true, name: true },
              },
              _count: {
                select: { sprints: true, members: true },
              },
            },
          },
        },
      }),
      db.task.count({ where: { assigneeId: userId } }),
      db.task.count({
        where: { assigneeId: userId, status: "done" },
      }),
    ]);

  return {
    assignedTasks,
    projects: projectMemberships.map((m) => m.project),
    stats: {
      totalTasks,
      completedTasks,
      activeProjects: projectMemberships.length,
    },
  };
}

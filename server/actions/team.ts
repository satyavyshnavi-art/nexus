"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { UserRole, TaskStatus } from "@prisma/client";
import { revalidatePath, unstable_cache } from "next/cache";

/**
 * Get all team members with their statistics
 * Direct DB query — no caching layer so data is always fresh
 */
export async function getTeamMembers() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      avatar: true,
      role: true,
      createdAt: true,
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
      assignedTasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          type: true,
          sprint: {
            select: {
              name: true,
              status: true,
              project: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => {
    const activeTasks = user.assignedTasks.filter(
      (task) => task.status !== TaskStatus.done
    ).length;
    const completedTasks = user.assignedTasks.filter(
      (task) => task.status === TaskStatus.done
    ).length;

    return {
      ...user,
      name: user.name ?? "Unknown User",
      designation: user.designation ?? "Team Member",
      avatar: user.avatar ?? null,
      assignedTasks: user.assignedTasks.slice(0, 5),
      stats: {
        projects: user.projectMemberships?.length ?? 0,
        activeTasks,
        completedTasks,
      },
    };
  });
}

/**
 * Get overall team statistics
 * Direct DB query for instant freshness
 */
export async function getTeamStats() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const [totalMembers, adminCount, memberCount, activeMembers] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: UserRole.admin } }),
      db.user.count({ where: { role: UserRole.member } }),
      db.user.count({
        where: {
          assignedTasks: {
            some: {
              status: {
                in: [TaskStatus.todo, TaskStatus.progress, TaskStatus.review],
              },
            },
          },
        },
      }),
    ]);

  return {
    totalMembers,
    activeMembers,
    adminCount,
    memberCount,
  };
}

/**
 * Cached team stats — skips auth() and caches results for 30s.
 * Use this from server components that already have the session.
 */
export const getTeamStatsCached = unstable_cache(
  async () => {
    const [totalMembers, adminCount, memberCount, activeMembers] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { role: UserRole.admin } }),
        db.user.count({ where: { role: UserRole.member } }),
        db.user.count({
          where: {
            assignedTasks: {
              some: {
                status: {
                  in: [TaskStatus.todo, TaskStatus.progress, TaskStatus.review],
                },
              },
            },
          },
        }),
      ]);

    return {
      totalMembers,
      activeMembers,
      adminCount,
      memberCount,
    };
  },
  ["team-stats"],
  {
    revalidate: 30,
    tags: ["team-stats"],
  }
);

/**
 * Update user role (Admin only)
 * Changes a user's role between admin and member
 */
export async function updateUserRole(userId: string, role: UserRole) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.admin) {
    throw new Error("Unauthorized: Only admins can change user roles");
  }

  // Prevent users from changing their own role
  if (session.user.id === userId) {
    throw new Error("Cannot change your own role");
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // Revalidate all team-related paths
  revalidatePath("/team");
  revalidatePath("/");
  revalidatePath("/admin/verticals");
  revalidatePath("/admin/users");

  return updated;
}

/**
 * Delete a user and clean up all related data (Admin only)
 * Reassigns created items to the admin performing the deletion
 */
export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.admin) {
    throw new Error("Unauthorized: Only admins can delete users");
  }

  if (session.user.id === userId) {
    throw new Error("Cannot delete your own account");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const adminId = session.user.id;

  await db.$transaction(async (tx) => {
    // Unassign tasks where user is assignee
    await tx.task.updateMany({
      where: { assigneeId: userId },
      data: { assigneeId: null },
    });

    // Reassign created tasks to admin
    await tx.task.updateMany({
      where: { createdBy: userId },
      data: { createdBy: adminId },
    });

    // Reassign created sprints to admin
    await tx.sprint.updateMany({
      where: { createdBy: userId },
      data: { createdBy: adminId },
    });

    // Reassign created projects to admin
    await tx.project.updateMany({
      where: { createdBy: userId },
      data: { createdBy: adminId },
    });

    // Clear GitHub linked-by references
    await tx.project.updateMany({
      where: { githubLinkedBy: userId },
      data: { githubLinkedBy: null },
    });

    // Delete user's comments
    await tx.taskComment.deleteMany({
      where: { userId },
    });

    // Delete user's attachments
    await tx.taskAttachment.deleteMany({
      where: { uploadedBy: userId },
    });

    // Delete GitHub sync logs by user
    await tx.gitHubSyncLog.deleteMany({
      where: { userId },
    });

    // VerticalUser and ProjectMember have onDelete: Cascade, but
    // we delete explicitly to be safe
    await tx.verticalUser.deleteMany({
      where: { userId },
    });

    await tx.projectMember.deleteMany({
      where: { userId },
    });

    // Finally, delete the user
    await tx.user.delete({
      where: { id: userId },
    });
  });

  revalidatePath("/team");
  revalidatePath("/");
  revalidatePath("/admin/users");
  revalidatePath("/admin/verticals");

  return { success: true, name: user.name || user.email };
}

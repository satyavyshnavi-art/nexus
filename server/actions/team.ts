"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { UserRole, TaskStatus } from "@prisma/client";
import { revalidatePath, unstable_cache } from "next/cache";

/**
 * Get all team members with their statistics
 * Cached for 30 seconds for performance
 */
export async function getTeamMembers() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const getCachedMembers = unstable_cache(
    async () => {
      try {
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
          },
          orderBy: { createdAt: "desc" },
        });

        // Fetch task stats separately for each user (more efficient than loading all tasks)
        const usersWithStats = await Promise.all(
          users.map(async (user) => {
            try {
              // Get all tasks for stats calculation
              const allTasks = await db.task.findMany({
                where: { assigneeId: user.id },
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
              });

              const activeTasks = allTasks.filter(
                (task) => task.status !== TaskStatus.done
              ).length;
              const completedTasks = allTasks.filter(
                (task) => task.status === TaskStatus.done
              ).length;

              return {
                ...user,
                name: user.name ?? "Unknown User",
                designation: user.designation ?? "Team Member",
                avatar: user.avatar ?? null,
                assignedTasks: allTasks.slice(0, 5), // Only keep 5 recent tasks in the result
                stats: {
                  projects: user.projectMemberships?.length ?? 0,
                  activeTasks: activeTasks ?? 0,
                  completedTasks: completedTasks ?? 0,
                },
              };
            } catch (error) {
              console.error(`Error fetching tasks for user ${user.id}:`, error);
              // Return user with default stats if task fetch fails
              return {
                ...user,
                name: user.name ?? "Unknown User",
                designation: user.designation ?? "Team Member",
                avatar: user.avatar ?? null,
                assignedTasks: [],
                stats: {
                  projects: user.projectMemberships?.length ?? 0,
                  activeTasks: 0,
                  completedTasks: 0,
                },
              };
            }
          })
        );

        return usersWithStats;
      } catch (error) {
        console.error("Error fetching team members:", error);
        // Return empty array if entire query fails
        return [];
      }
    },
    ["team-members"],
    {
      revalidate: 30, // Cache for 30 seconds
      tags: ["team-members"],
    }
  );

  return getCachedMembers();
}

/**
 * Get overall team statistics
 * Cached for 30 seconds
 */
export async function getTeamStats() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const getCachedStats = unstable_cache(
    async () => {
      try {
        const totalMembers = await db.user.count();
        const adminCount = await db.user.count({
          where: { role: UserRole.admin },
        });
        const memberCount = await db.user.count({
          where: { role: UserRole.member },
        });

        // Count active members (those with active task assignments)
        const activeMembers = await db.user.count({
          where: {
            assignedTasks: {
              some: {
                status: {
                  in: [TaskStatus.todo, TaskStatus.progress, TaskStatus.review],
                },
              },
            },
          },
        });

        return {
          totalMembers: totalMembers ?? 0,
          activeMembers: activeMembers ?? 0,
          adminCount: adminCount ?? 0,
          memberCount: memberCount ?? 0,
        };
      } catch (error) {
        console.error("Error fetching team stats:", error);
        // Return default stats if query fails
        return {
          totalMembers: 0,
          activeMembers: 0,
          adminCount: 0,
          memberCount: 0,
        };
      }
    },
    ["team-stats"],
    {
      revalidate: 30, // Cache for 30 seconds
      tags: ["team-stats"],
    }
  );

  return getCachedStats();
}

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

  // Revalidate team page cache
  revalidatePath("/team");
  revalidatePath("/");

  return updated;
}

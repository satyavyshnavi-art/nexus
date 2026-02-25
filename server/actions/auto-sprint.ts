"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { SprintStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Get Monday and Friday of the current week
 */
function getCurrentWeekBounds(): { monday: Date; friday: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday };
}

/**
 * Format date as "Mon DD"
 */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Ensures a weekly sprint exists for the current week if project has autoSprintEnabled.
 * Called at project page load. Only creates if no active/planned sprint covers this week.
 */
export async function ensureWeeklySprint(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, autoSprintEnabled: true, createdBy: true },
  });

  if (!project || !project.autoSprintEnabled) return null;

  const { monday, friday } = getCurrentWeekBounds();

  // Check if there's already an active or planned sprint that overlaps this week
  const existingSprint = await db.sprint.findFirst({
    where: {
      projectId,
      status: { in: [SprintStatus.active, SprintStatus.planned] },
      startDate: { lte: friday },
      endDate: { gte: monday },
    },
  });

  if (existingSprint) return existingSprint;

  // Also check if there's already an active sprint (don't create a new one)
  const activeSprint = await db.sprint.findFirst({
    where: { projectId, status: SprintStatus.active },
  });

  if (activeSprint) return activeSprint;

  // Create a new weekly sprint and activate it
  const sprintName = `Week of ${formatShortDate(monday)} - ${formatShortDate(friday)}`;

  const sprint = await db.sprint.create({
    data: {
      projectId,
      name: sprintName,
      startDate: monday,
      endDate: friday,
      status: SprintStatus.active,
      autoCreated: true,
      createdBy: project.createdBy,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/sprints`);

  return sprint;
}

/**
 * Toggle auto-sprint for a project (admin only)
 */
export async function toggleAutoSprint(projectId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const project = await db.project.update({
    where: { id: projectId },
    data: { autoSprintEnabled: enabled },
  });

  // If enabling, ensure a sprint exists for this week
  if (enabled) {
    await ensureWeeklySprint(projectId);
  }

  revalidatePath(`/projects/${projectId}`);

  return project;
}

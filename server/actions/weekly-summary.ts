"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { generateWeeklySummaryAI } from "@/lib/ai/weekly-summary";
import { revalidatePath } from "next/cache";

function getCurrentWeekBounds(): { monday: Date; friday: Date } {
  const now = new Date();
  const day = now.getDay();
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
 * Generate a weekly summary for the current week using AI
 * Admin only
 */
export async function generateWeeklySummary(projectId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });

  if (!project) throw new Error("Project not found");

  const { monday, friday } = getCurrentWeekBounds();

  // Fetch tasks updated this week
  const tasks = await db.task.findMany({
    where: {
      sprint: { projectId },
      updatedAt: { gte: monday, lte: friday },
      type: { in: ["task", "bug"] },
    },
    select: {
      title: true,
      status: true,
      type: true,
      assignee: { select: { name: true } },
    },
  });

  const completedTasks = tasks
    .filter((t) => t.status === "done")
    .map((t) => ({ title: t.title, assignee: t.assignee?.name || null, type: t.type }));

  const inProgressTasks = tasks
    .filter((t) => t.status === "progress" || t.status === "review")
    .map((t) => ({ title: t.title, assignee: t.assignee?.name || null, type: t.type }));

  const weekRange = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${friday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const aiResult = await generateWeeklySummaryAI({
    projectName: project.name,
    completedTasks,
    inProgressTasks,
    weekRange,
  });

  // Upsert the summary (one per project per week)
  const summary = await db.weeklySummary.upsert({
    where: {
      projectId_weekStart: { projectId, weekStart: monday },
    },
    update: {
      weekEnd: friday,
      summary: aiResult.summary,
      highlights: aiResult.highlights,
      blockers: aiResult.blockers,
    },
    create: {
      projectId,
      weekStart: monday,
      weekEnd: friday,
      summary: aiResult.summary,
      highlights: aiResult.highlights,
      blockers: aiResult.blockers,
    },
  });

  revalidatePath(`/projects/${projectId}`);

  return { ...summary, nextWeekFocus: aiResult.next_week_focus };
}

/**
 * Get recent weekly summaries for a project
 */
export async function getWeeklySummaries(projectId: string, limit: number = 5) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.weeklySummary.findMany({
    where: { projectId },
    orderBy: { weekStart: "desc" },
    take: limit,
  });
}

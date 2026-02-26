"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { generateProjectReportAI, type ProjectReportOutput } from "@/lib/ai/project-report";
import { canViewReports } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { z } from "zod";

/**
 * Generate a comprehensive project progress report using AI
 * Admin + developer only
 */
export async function generateProjectReport(
  projectId: string
): Promise<ProjectReportOutput> {
  // Runtime validation
  z.string().min(1).parse(projectId);

  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (!canViewReports(session.user.role as UserRole)) {
    throw new Error("Unauthorized: Only admins and developers can generate reports");
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });

  if (!project) throw new Error("Project not found");

  // Gather sprint stats
  const [totalSprints, completedSprints, activeSprint] = await Promise.all([
    db.sprint.count({ where: { projectId } }),
    db.sprint.count({ where: { projectId, status: "completed" } }),
    db.sprint.findFirst({
      where: { projectId, status: "active" },
      select: { name: true },
    }),
  ]);

  // Gather task stats (tickets only)
  const [totalTasks, completedTasks, inProgressTasks] = await Promise.all([
    db.task.count({
      where: { sprint: { projectId }, type: { in: ["task", "bug"] } },
    }),
    db.task.count({
      where: { sprint: { projectId }, type: { in: ["task", "bug"] }, status: "done" },
    }),
    db.task.count({
      where: { sprint: { projectId }, type: { in: ["task", "bug"] }, status: { in: ["progress", "review"] } },
    }),
  ]);

  // Gather team performance
  const members = await db.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          assignedTasks: {
            where: { sprint: { projectId }, type: { in: ["task", "bug"] } },
            select: { status: true },
          },
        },
      },
    },
  });

  const teamMembers = members.map((m) => ({
    name: m.user.name || "Unknown",
    tasksCompleted: m.user.assignedTasks.filter((t) => t.status === "done").length,
    tasksTotal: m.user.assignedTasks.length,
  }));

  return generateProjectReportAI({
    projectName: project.name,
    totalSprints,
    completedSprints,
    activeSprint: activeSprint?.name || null,
    totalTasks,
    completedTasks,
    inProgressTasks,
    teamMembers,
  });
}

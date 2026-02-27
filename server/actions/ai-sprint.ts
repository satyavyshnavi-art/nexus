"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { generateSprintPlan, SprintPlanOutput } from "@/lib/ai/sprint-planner";
import type { ImageInput } from "@/lib/ai/gemini";
import { TaskType, TaskPriority, SprintStatus } from "@prisma/client";
import { z } from "zod";
import { confirmedPlanSchema, confirmedTasksArraySchema } from "@/lib/validation/schemas";

// --- Role Matching Helper ---

const ROLE_KEYWORDS: Record<string, string[]> = {
  UI: ["frontend", "ui", "react", "angular", "vue", "css", "html", "tailwind", "next.js", "nextjs"],
  Backend: ["backend", "server", "api", "node", "python", "java", "express", "nestjs", "django", "flask", "spring"],
  QA: ["qa", "test", "quality", "automation", "selenium", "cypress", "jest", "testing"],
  DevOps: ["devops", "ci/cd", "docker", "kubernetes", "aws", "cloud", "infrastructure", "deployment", "terraform"],
  "Full-Stack": ["fullstack", "full-stack", "full stack", "mern", "mean"],
  Design: ["design", "ux", "ui/ux", "figma", "sketch", "prototype", "wireframe"],
  Data: ["data", "analytics", "ml", "machine learning", "ai", "database", "sql", "etl"],
  Mobile: ["mobile", "ios", "android", "react native", "flutter", "swift", "kotlin"],
};

export type RoleMatchResult = {
  userId: string;
  name: string;
  confidence: "high" | "medium" | "low";
};

function matchRoleToMembers(
  requiredRole: string,
  members: { id: string; name: string | null; designation: string | null }[]
): RoleMatchResult[] {
  const keywords = ROLE_KEYWORDS[requiredRole] || [];
  const results: RoleMatchResult[] = [];

  for (const member of members) {
    if (!member.designation) continue;
    const designation = member.designation.toLowerCase();

    // Exact role name match = high confidence
    if (designation.includes(requiredRole.toLowerCase())) {
      results.push({ userId: member.id, name: member.name || "Unknown", confidence: "high" });
      continue;
    }

    // Keyword match count determines confidence
    const matchCount = keywords.filter((kw) => designation.includes(kw)).length;
    if (matchCount >= 2) {
      results.push({ userId: member.id, name: member.name || "Unknown", confidence: "high" });
    } else if (matchCount === 1) {
      results.push({ userId: member.id, name: member.name || "Unknown", confidence: "medium" });
    }
  }

  // If no matches, add all members with low confidence
  if (results.length === 0) {
    for (const member of members) {
      results.push({ userId: member.id, name: member.name || "Unknown", confidence: "low" });
    }
  }

  // Sort by confidence: high > medium > low
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);

  return results;
}

// --- Types for two-step flow ---
// Type names kept for backward compatibility with UI components.
// AI "tasks" map to Stories, AI "subtasks" map to Tickets in the DB.

export type SuggestedSubtask = {
  title: string;
  required_role: string;
  priority: "low" | "medium" | "high" | "critical";
  suggested_assignees: RoleMatchResult[];
  selected_assignee_id?: string;
};

export type SuggestedTask = {
  title: string;
  category: string;
  required_role: string;
  labels: string[];
  priority: "low" | "medium" | "high" | "critical";
  subtasks: SuggestedSubtask[];
  suggested_assignees: RoleMatchResult[];
  selected_assignee_id?: string;
};

export type GeneratedSprintPlan = {
  sprint_name: string;
  duration_days: number;
  role_distribution: { role: string; task_count: number }[];
  tasks: SuggestedTask[];
  members: { id: string; name: string | null; designation: string | null }[];
};

// --- Step 1: Generate (read-only, no DB writes) ---

export async function aiGenerateSprintPlan(
  projectId: string,
  inputText: string,
  images?: ImageInput[]
): Promise<{ success: true; plan: GeneratedSprintPlan } | { success: false; error: string }> {
  // Runtime validation
  z.string().min(1).parse(projectId);
  z.string().min(1).max(10000).parse(inputText);

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Fetch project members with designations
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, designation: true },
          },
        },
      },
    },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  const members = project.members.map((m) => m.user);

  let aiPlan: SprintPlanOutput;
  try {
    aiPlan = await generateSprintPlan(inputText, members, images);
  } catch (error) {
    console.error("[AI Generate Plan] error:", error);
    const message = error instanceof Error ? error.message : "AI generation failed";
    return { success: false, error: message };
  }

  // Enrich tasks with assignee suggestions
  const tasks: SuggestedTask[] = aiPlan.tasks.map((task) => ({
    title: task.title,
    category: task.category || "General",
    required_role: task.required_role,
    labels: task.labels,
    priority: task.priority,
    subtasks: task.subtasks.map((subtask) => ({
      title: subtask.title,
      required_role: subtask.required_role,
      priority: subtask.priority,
      suggested_assignees: matchRoleToMembers(subtask.required_role, members),
    })),
    suggested_assignees: matchRoleToMembers(task.required_role, members),
  }));

  return {
    success: true,
    plan: {
      sprint_name: aiPlan.sprint_name,
      duration_days: aiPlan.duration_days,
      role_distribution: aiPlan.role_distribution,
      tasks,
      members,
    },
  };
}

// --- Step 2: Confirm (writes to DB) ---
// AI "task" -> DB Story (type: "story", parentTaskId: null)
// AI "subtask" under a task -> DB Ticket (type: "task", parentTaskId: storyId)

export type ConfirmedSubtask = {
  title: string;
  required_role: string;
  priority: "low" | "medium" | "high" | "critical";
  assignee_id?: string;
};

export type ConfirmedTask = {
  title: string;
  category: string;
  required_role: string;
  labels: string[];
  priority: "low" | "medium" | "high" | "critical";
  assignee_id?: string;
  subtasks: ConfirmedSubtask[];
};

export type ConfirmedPlan = {
  sprint_name: string;
  duration_days: number;
  tasks: ConfirmedTask[];
};

export async function aiConfirmSprintPlan(
  projectId: string,
  confirmedPlan: ConfirmedPlan
): Promise<{ success: true; sprintName: string; taskCount: number } | { success: false; error: string }> {
  // Runtime validation
  z.string().min(1).parse(projectId);
  const validatedPlan = confirmedPlanSchema.parse(confirmedPlan);

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + validatedPlan.duration_days);

  try {
    const data = await db.$transaction(async (tx) => {
      // Create the sprint
      const sprint = await tx.sprint.create({
        data: {
          projectId,
          name: validatedPlan.sprint_name,
          startDate,
          endDate,
          status: SprintStatus.planned,
          createdBy: session.user.id,
        },
      });

      let totalTaskCount = 0;

      // Each confirmed "task" becomes a Story in the DB
      for (const task of validatedPlan.tasks) {
        const storyLabels = [...task.labels];
        if (task.category && !storyLabels.includes(task.category)) {
          storyLabels.push(task.category);
        }

        // Create Story (type: "story", parentTaskId: null)
        const storyRecord = await tx.task.create({
          data: {
            sprintId: sprint.id,
            title: task.title,
            type: TaskType.story,
            priority: task.priority as TaskPriority,
            requiredRole: task.required_role,
            labels: storyLabels,
            assigneeId: task.assignee_id || undefined,
            createdBy: session.user.id,
          },
        });
        totalTaskCount++;

        // Each confirmed "subtask" becomes a Ticket (type: "task") under the story
        if (task.subtasks && task.subtasks.length > 0) {
          const ticketData = task.subtasks.map((subtask) => ({
            sprintId: sprint.id,
            title: subtask.title,
            type: TaskType.task,
            parentTaskId: storyRecord.id,
            priority: subtask.priority as TaskPriority,
            requiredRole: subtask.required_role,
            assigneeId: subtask.assignee_id || undefined,
            createdBy: session.user.id,
          }));

          await tx.task.createMany({ data: ticketData });
          totalTaskCount += ticketData.length;
        }
      }

      return {
        success: true as const,
        sprintName: sprint.name,
        taskCount: totalTaskCount,
      };
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/sprints`);

    return data;
  } catch (error) {
    console.error("[AI Confirm Sprint] DB error:", error);
    return { success: false, error: "Failed to save sprint plan" };
  }
}

// --- Ticket Generation (two-step, for existing sprints) ---

export type GeneratedTicketsPlan = {
  tasks: SuggestedTask[];
  members: { id: string; name: string | null; designation: string | null }[];
  role_distribution: { role: string; task_count: number }[];
};

// Step 1: Generate tickets (read-only, no DB writes)
export async function aiGenerateTickets(
  sprintId: string,
  inputText: string,
  images?: ImageInput[]
): Promise<{ success: true; plan: GeneratedTicketsPlan } | { success: false; error: string }> {
  // Runtime validation
  z.string().min(1).parse(sprintId);
  z.string().min(1).max(10000).parse(inputText);

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Look up sprint to get projectId
  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: { projectId: true },
  });

  if (!sprint) {
    return { success: false, error: "Sprint not found" };
  }

  // Fetch project members with designations
  const project = await db.project.findUnique({
    where: { id: sprint.projectId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, designation: true },
          },
        },
      },
    },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  const members = project.members.map((m) => m.user);

  let aiPlan: SprintPlanOutput;
  try {
    aiPlan = await generateSprintPlan(inputText, members, images);
  } catch (error) {
    console.error("[AI Generate Tickets] Gemini error:", error);
    const message = error instanceof Error ? error.message : "AI generation failed";
    return { success: false, error: message };
  }

  // Enrich tasks with assignee suggestions
  const tasks: SuggestedTask[] = aiPlan.tasks.map((task) => ({
    title: task.title,
    category: task.category || "General",
    required_role: task.required_role,
    labels: task.labels,
    priority: task.priority,
    subtasks: task.subtasks.map((subtask) => ({
      title: subtask.title,
      required_role: subtask.required_role,
      priority: subtask.priority,
      suggested_assignees: matchRoleToMembers(subtask.required_role, members),
    })),
    suggested_assignees: matchRoleToMembers(task.required_role, members),
  }));

  // Compute role distribution
  const roleMap = new Map<string, number>();
  tasks.forEach((task) => {
    roleMap.set(task.required_role, (roleMap.get(task.required_role) || 0) + 1);
  });

  const role_distribution = Array.from(roleMap.entries()).map(([role, task_count]) => ({
    role,
    task_count,
  }));

  return {
    success: true,
    plan: { tasks, members, role_distribution },
  };
}

// Step 2: Confirm tickets (writes to DB in existing sprint)
// AI "task" -> DB Story (type: "story", parentTaskId: null)
// AI "subtask" under a task -> DB Ticket (type: "task", parentTaskId: storyId)
export async function aiConfirmTickets(
  sprintId: string,
  confirmedTasks: ConfirmedTask[]
): Promise<{ success: true; taskCount: number } | { success: false; error: string }> {
  // Runtime validation
  z.string().min(1).parse(sprintId);
  const validatedTasks = confirmedTasksArraySchema.parse(confirmedTasks);

  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: { projectId: true },
  });

  if (!sprint) {
    return { success: false, error: "Sprint not found" };
  }

  try {
    const data = await db.$transaction(async (tx) => {
      let totalTaskCount = 0;

      // Each confirmed "task" becomes a Story in the DB
      for (const task of validatedTasks) {
        const storyLabels = [...task.labels];
        if (task.category && !storyLabels.includes(task.category)) {
          storyLabels.push(task.category);
        }

        // Create Story (type: "story", parentTaskId: null)
        const storyRecord = await tx.task.create({
          data: {
            sprintId,
            title: task.title,
            type: TaskType.story,
            priority: task.priority as TaskPriority,
            requiredRole: task.required_role,
            labels: storyLabels,
            assigneeId: task.assignee_id || undefined,
            createdBy: session.user.id,
          },
        });
        totalTaskCount++;

        // Each confirmed "subtask" becomes a Ticket (type: "task") under the story
        if (task.subtasks && task.subtasks.length > 0) {
          const ticketData = task.subtasks.map((subtask) => ({
            sprintId,
            title: subtask.title,
            type: TaskType.task,
            parentTaskId: storyRecord.id,
            priority: subtask.priority as TaskPriority,
            requiredRole: subtask.required_role,
            assigneeId: subtask.assignee_id || undefined,
            createdBy: session.user.id,
          }));

          await tx.task.createMany({ data: ticketData });
          totalTaskCount += ticketData.length;
        }
      }

      return {
        success: true as const,
        taskCount: totalTaskCount,
      };
    });

    revalidatePath(`/projects/${sprint.projectId}`);
    revalidatePath(`/projects/${sprint.projectId}/sprints`);

    return data;
  } catch (error) {
    console.error("[AI Confirm Tickets] DB error:", error);
    return { success: false, error: "Failed to save generated tickets" };
  }
}

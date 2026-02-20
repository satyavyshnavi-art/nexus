"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { generateSprintTasks } from "@/lib/ai/sprint-generator";
import { generateSprintPlan, SprintPlanOutput } from "@/lib/ai/sprint-planner";
import { TaskType, TaskPriority, SprintStatus } from "@prisma/client";

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

export type SuggestedTask = {
  title: string;
  required_role: string;
  labels: string[];
  priority: "low" | "medium" | "high" | "critical";
  suggested_assignees: RoleMatchResult[];
  selected_assignee_id?: string;
};

export type SuggestedStory = {
  title: string;
  story_points: number;
  required_role: string;
  labels: string[];
  priority: "low" | "medium" | "high" | "critical";
  tasks: SuggestedTask[];
};

export type GeneratedSprintPlan = {
  sprint_name: string;
  duration_days: number;
  role_distribution: { role: string; story_points: number; task_count: number }[];
  stories: SuggestedStory[];
  members: { id: string; name: string | null; designation: string | null }[];
};

// --- Step 1: Generate (read-only, no DB writes) ---

export async function aiGenerateSprintPlan(
  projectId: string,
  inputText: string
): Promise<{ success: true; plan: GeneratedSprintPlan } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
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
    aiPlan = await generateSprintPlan(inputText, members);
  } catch (error) {
    console.error("[AI Generate Plan] error:", error);
    const message = error instanceof Error ? error.message : "AI generation failed";
    return { success: false, error: message };
  }

  // Enrich stories with assignee suggestions
  const stories: SuggestedStory[] = aiPlan.stories.map((story) => ({
    title: story.title,
    story_points: story.story_points,
    required_role: story.required_role,
    labels: story.labels,
    priority: story.priority,
    tasks: story.tasks.map((task) => ({
      title: task.title,
      required_role: task.required_role,
      labels: task.labels,
      priority: task.priority,
      suggested_assignees: matchRoleToMembers(task.required_role, members),
    })),
  }));

  return {
    success: true,
    plan: {
      sprint_name: aiPlan.sprint_name,
      duration_days: aiPlan.duration_days,
      role_distribution: aiPlan.role_distribution,
      stories,
      members,
    },
  };
}

// --- Step 2: Confirm (writes to DB) ---

export type ConfirmedStory = {
  title: string;
  story_points: number;
  required_role: string;
  labels: string[];
  priority: "low" | "medium" | "high" | "critical";
  tasks: {
    title: string;
    required_role: string;
    labels: string[];
    priority: "low" | "medium" | "high" | "critical";
    assignee_id?: string;
  }[];
};

export type ConfirmedPlan = {
  sprint_name: string;
  duration_days: number;
  stories: ConfirmedStory[];
};

export async function aiConfirmSprintPlan(
  projectId: string,
  confirmedPlan: ConfirmedPlan
): Promise<{ success: true; sprintName: string; taskCount: number } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + confirmedPlan.duration_days);

  try {
    const data = await db.$transaction(async (tx) => {
      const sprint = await tx.sprint.create({
        data: {
          projectId,
          name: confirmedPlan.sprint_name,
          startDate,
          endDate,
          status: SprintStatus.planned,
          createdBy: session.user.id,
        },
      });

      const storyData = confirmedPlan.stories.map((story) => ({
        sprintId: sprint.id,
        title: story.title,
        type: TaskType.story,
        storyPoints: story.story_points,
        priority: story.priority as TaskPriority,
        requiredRole: story.required_role,
        labels: story.labels,
        createdBy: session.user.id,
      }));

      const storyTasks = await tx.task.createManyAndReturn({
        data: storyData,
      });

      const storyIdMap = new Map(
        storyTasks.map((task, index) => [index, task.id])
      );

      const childTaskData = confirmedPlan.stories.flatMap((story, storyIndex) =>
        story.tasks.map((task) => ({
          sprintId: sprint.id,
          title: task.title,
          type: TaskType.task,
          parentTaskId: storyIdMap.get(storyIndex)!,
          priority: task.priority as TaskPriority,
          requiredRole: task.required_role,
          labels: task.labels,
          assigneeId: task.assignee_id || undefined,
          createdBy: session.user.id,
        }))
      );

      if (childTaskData.length > 0) {
        await tx.task.createMany({
          data: childTaskData,
        });
      }

      return {
        success: true as const,
        sprintName: sprint.name,
        taskCount: storyTasks.length + childTaskData.length,
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

// --- Legacy actions (backward compatible) ---

export async function aiGenerateSprintTasks(
  sprintId: string,
  inputText: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false as const, error: "Unauthorized" };
  }

  let result;
  try {
    result = await generateSprintTasks(inputText);
  } catch (error) {
    console.error("[AI Generate Tasks] Gemini error:", error);
    const message =
      error instanceof Error ? error.message : "AI generation failed";
    return { success: false as const, error: message };
  }

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    select: { projectId: true },
  });

  if (!sprint) {
    return { success: false as const, error: "Sprint not found" };
  }

  try {
    const data = await db.$transaction(async (tx) => {
      const storyData = result.stories.map((story) => ({
        sprintId,
        title: story.title,
        type: TaskType.story,
        storyPoints: story.story_points,
        priority: story.priority as TaskPriority,
        requiredRole: story.required_role,
        labels: story.labels,
        createdBy: session.user.id,
      }));

      const storyTasks = await tx.task.createManyAndReturn({
        data: storyData,
      });

      const storyIdMap = new Map(
        storyTasks.map((task, index) => [index, task.id])
      );

      const childTaskData = result.stories.flatMap((story, storyIndex) =>
        story.tasks.map((task) => ({
          sprintId,
          title: task.title,
          type: TaskType.task,
          parentTaskId: storyIdMap.get(storyIndex)!,
          priority: task.priority as TaskPriority,
          requiredRole: task.required_role,
          labels: task.labels,
          createdBy: session.user.id,
        }))
      );

      if (childTaskData.length > 0) {
        await tx.task.createMany({
          data: childTaskData,
        });
      }

      return {
        success: true as const,
        taskCount: storyTasks.length + childTaskData.length,
      };
    });

    revalidatePath(`/projects/${sprint.projectId}`);
    revalidatePath(`/projects/${sprint.projectId}/sprints`);

    return data;
  } catch (error) {
    console.error("[AI Generate Tasks] DB error:", error);
    return { success: false as const, error: "Failed to save generated tasks" };
  }
}

export async function aiPlanSprint(projectId: string, inputText: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false as const, error: "Unauthorized" };
  }

  let plan;
  try {
    plan = await generateSprintPlan(inputText);
  } catch (error) {
    console.error("[AI Plan Sprint] Gemini error:", error);
    const message =
      error instanceof Error ? error.message : "AI generation failed";
    return { success: false as const, error: message };
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration_days);

  try {
    const data = await db.$transaction(async (tx) => {
      const sprint = await tx.sprint.create({
        data: {
          projectId,
          name: plan.sprint_name,
          startDate,
          endDate,
          status: SprintStatus.planned,
          createdBy: session.user.id,
        },
      });

      const storyData = plan.stories.map((story) => ({
        sprintId: sprint.id,
        title: story.title,
        type: TaskType.story,
        storyPoints: story.story_points,
        priority: story.priority as TaskPriority,
        requiredRole: story.required_role,
        labels: story.labels,
        createdBy: session.user.id,
      }));

      const storyTasks = await tx.task.createManyAndReturn({
        data: storyData,
      });

      const storyIdMap = new Map(
        storyTasks.map((task, index) => [index, task.id])
      );

      const childTaskData = plan.stories.flatMap((story, storyIndex) =>
        story.tasks.map((task) => ({
          sprintId: sprint.id,
          title: task.title,
          type: TaskType.task,
          parentTaskId: storyIdMap.get(storyIndex)!,
          priority: task.priority as TaskPriority,
          requiredRole: task.required_role,
          labels: task.labels,
          createdBy: session.user.id,
        }))
      );

      if (childTaskData.length > 0) {
        await tx.task.createMany({
          data: childTaskData,
        });
      }

      return {
        success: true as const,
        sprintName: sprint.name,
        taskCount: storyTasks.length + childTaskData.length,
      };
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/sprints`);

    return data;
  } catch (error) {
    console.error("[AI Plan Sprint] DB error:", error);
    return { success: false as const, error: "Failed to save sprint plan" };
  }
}

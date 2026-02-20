"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { generateSprintTasks } from "@/lib/ai/sprint-generator";
import { generateSprintPlan } from "@/lib/ai/sprint-planner";
import { TaskType, SprintStatus } from "@prisma/client";

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

  // Look up projectId for revalidation
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
        createdBy: session.user.id,
      }));

      const storyTasks = await tx.task.createManyAndReturn({
        data: storyData,
      });

      const storyIdMap = new Map(
        storyTasks.map((task, index) => [index, task.id])
      );

      const childTaskData = result.stories.flatMap((story, storyIndex) =>
        story.tasks.map((taskTitle) => ({
          sprintId,
          title: taskTitle,
          type: TaskType.task,
          parentTaskId: storyIdMap.get(storyIndex)!,
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
        createdBy: session.user.id,
      }));

      const storyTasks = await tx.task.createManyAndReturn({
        data: storyData,
      });

      const storyIdMap = new Map(
        storyTasks.map((task, index) => [index, task.id])
      );

      const childTaskData = plan.stories.flatMap((story, storyIndex) =>
        story.tasks.map((taskTitle) => ({
          sprintId: sprint.id,
          title: taskTitle,
          type: TaskType.task,
          parentTaskId: storyIdMap.get(storyIndex)!,
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

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
    throw new Error("Unauthorized");
  }

  const result = await generateSprintTasks(inputText);

  // Look up projectId for revalidation
  const sprint = await db.sprint.findUniqueOrThrow({
    where: { id: sprintId },
    select: { projectId: true },
  });

  const data = await db.$transaction(async (tx) => {
    // Step 1: Create all story tasks in one batch
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

    // Step 2: Create map for story index lookup
    const storyIdMap = new Map(
      storyTasks.map((task, index) => [index, task.id])
    );

    // Step 3: Create all child tasks in one batch
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
      success: true,
      taskCount: storyTasks.length + childTaskData.length,
    };
  });

  revalidatePath(`/projects/${sprint.projectId}`);
  revalidatePath(`/projects/${sprint.projectId}/sprints`);

  return data;
}

export async function aiPlanSprint(projectId: string, inputText: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const plan = await generateSprintPlan(inputText);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration_days);

  const data = await db.$transaction(async (tx) => {
    // Step 1: Create the sprint
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

    // Step 2: Create all story tasks in one batch
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

    // Step 3: Create map for story index lookup
    const storyIdMap = new Map(
      storyTasks.map((task, index) => [index, task.id])
    );

    // Step 4: Create all child tasks in one batch
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
      sprint,
      taskCount: storyTasks.length + childTaskData.length,
    };
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/sprints`);

  return data;
}

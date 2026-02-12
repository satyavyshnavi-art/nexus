"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { generateSprintTasks } from "@/lib/ai/sprint-generator";
import { TaskType } from "@prisma/client";

export async function aiGenerateSprintTasks(
  sprintId: string,
  inputText: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const result = await generateSprintTasks(inputText);

  // OPTIMIZED: Batch create all tasks (3 queries instead of 630+)
  return db.$transaction(async (tx) => {
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
}

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

  // Transaction to create all tasks
  return db.$transaction(async (tx) => {
    const createdTasks = [];

    for (const story of result.stories) {
      // Create story task
      const storyTask = await tx.task.create({
        data: {
          sprintId,
          title: story.title,
          type: TaskType.story,
          storyPoints: story.story_points,
          createdBy: session.user.id,
        },
      });

      createdTasks.push(storyTask);

      // Create child tasks
      for (const taskTitle of story.tasks) {
        const childTask = await tx.task.create({
          data: {
            sprintId,
            title: taskTitle,
            type: TaskType.task,
            parentTaskId: storyTask.id,
            createdBy: session.user.id,
          },
        });
        createdTasks.push(childTask);
      }
    }

    return { success: true, taskCount: createdTasks.length };
  });
}

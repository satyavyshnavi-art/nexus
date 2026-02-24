"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/server/actions/notifications";

export async function createComment(taskId: string, content: string) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    if (!content.trim()) {
        throw new Error("Comment content cannot be empty");
    }

    const comment = await db.taskComment.create({
        data: {
            taskId,
            userId: session.user.id,
            content,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });

    // Notify task assignee and creator about the comment (non-blocking)
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, createdBy: true, title: true, sprint: { select: { projectId: true } } },
    });

    if (task) {
      const notifyIds = new Set<string>();
      if (task.assigneeId) notifyIds.add(task.assigneeId);
      if (task.createdBy) notifyIds.add(task.createdBy);
      notifyIds.delete(session.user.id); // Don't notify yourself

      const commenterName = comment.user?.name || session.user.name || "Someone";
      for (const userId of notifyIds) {
        createNotification({
          userId,
          type: "comment_added",
          title: "New comment on task",
          message: `${commenterName} commented on "${task.title}"`,
          link: `/projects/${task.sprint.projectId}`,
        });
      }
    }

    revalidatePath(`/projects`);
    return comment;
}

export async function getTaskComments(taskId: string) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const comments = await db.taskComment.findMany({
        where: {
            taskId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    return comments;
}

export async function deleteComment(commentId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const comment = await db.taskComment.findUnique({
        where: { id: commentId },
    });

    if (!comment) {
        throw new Error("Comment not found");
    }

    // Allow deletion if user is author or admin
    if (comment.userId !== session.user.id && session.user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    await db.taskComment.delete({
        where: { id: commentId },
    });

    revalidatePath(`/projects`);
    return { success: true };
}

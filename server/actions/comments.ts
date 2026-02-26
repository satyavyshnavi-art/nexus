"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCommentSchema } from "@/lib/validation/schemas";

export async function createComment(taskId: string, content: string) {
    // Runtime validation
    const validated = createCommentSchema.parse({ taskId, content });

    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const comment = await db.taskComment.create({
        data: {
            taskId: validated.taskId,
            userId: session.user.id,
            content: validated.content,
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

    revalidatePath(`/projects`);
    return comment;
}

export async function getTaskComments(taskId: string) {
    // Runtime validation
    z.string().min(1).parse(taskId);

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
    // Runtime validation
    z.string().min(1).parse(commentId);

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

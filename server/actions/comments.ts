"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";

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

    revalidatePath(`/projects`); // Revalidate generally, or specific paths if possible
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

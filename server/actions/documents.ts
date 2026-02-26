"use server";

import { db } from "@/server/db";
import { auth } from "@/lib/auth/config";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createProjectDocumentSchema, updateProjectDocumentSchema } from "@/lib/validation/schemas";

// Check if user has access to a project
async function canAccessProject(projectId: string, userId: string, isAdmin: boolean) {
    if (isAdmin) return true;

    const membership = await db.projectMember.findUnique({
        where: {
            projectId_userId: { projectId, userId },
        },
    });

    return !!membership;
}

export async function createProjectDocument(data: {
    projectId: string;
    title: string;
    url: string;
    description?: string;
}) {
    // Runtime validation
    const validated = createProjectDocumentSchema.parse(data);

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const hasAccess = await canAccessProject(
        validated.projectId,
        session.user.id,
        session.user.role === "admin"
    );

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    const document = await db.projectDocument.create({
        data: {
            ...validated,
            createdBy: session.user.id,
        },
    });

    revalidatePath(`/projects/${validated.projectId}`);
    return document;
}

export async function updateProjectDocument(
    documentId: string,
    data: {
        title?: string;
        url?: string;
        description?: string | null;
    }
) {
    // Runtime validation
    z.string().min(1).parse(documentId);
    const validatedData = updateProjectDocumentSchema.parse(data);

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const existingDoc = await db.projectDocument.findUnique({
        where: { id: documentId },
        select: { projectId: true, createdBy: true },
    });

    if (!existingDoc) throw new Error("Document not found");

    const isAdmin = session.user.role === "admin";
    const isCreator = existingDoc.createdBy === session.user.id;

    if (!isAdmin && !isCreator) {
        throw new Error("Unauthorized: You can only edit your own documents");
    }

    const updatedDocument = await db.projectDocument.update({
        where: { id: documentId },
        data: validatedData,
    });

    revalidatePath(`/projects/${existingDoc.projectId}`);
    return updatedDocument;
}

export async function deleteProjectDocument(documentId: string) {
    // Runtime validation
    z.string().min(1).parse(documentId);

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const existingDoc = await db.projectDocument.findUnique({
        where: { id: documentId },
        select: { projectId: true, createdBy: true },
    });

    if (!existingDoc) throw new Error("Document not found");

    const isAdmin = session.user.role === "admin";
    const isCreator = existingDoc.createdBy === session.user.id;

    if (!isAdmin && !isCreator) {
        throw new Error("Unauthorized: You can only delete your own documents");
    }

    await db.projectDocument.delete({
        where: { id: documentId },
    });

    revalidatePath(`/projects/${existingDoc.projectId}`);
    return { success: true };
}

"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { extractTicketsFromDocument, type ExtractedTicket } from "@/lib/ai/ticket-extractor";
import { TaskType, TaskPriority } from "@prisma/client";

export async function parseDocumentForTickets(
  documentText: string
): Promise<{ success: true; tickets: ExtractedTicket[] } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    if (!documentText.trim()) {
      return { success: false, error: "Document is empty" };
    }

    // Limit document size to ~50K chars to avoid AI token limits
    const trimmedText = documentText.slice(0, 50000);

    const result = await extractTicketsFromDocument(trimmedText);
    return { success: true, tickets: result.tickets };
  } catch (error) {
    console.error("Failed to parse document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse document",
    };
  }
}

export async function bulkCreateTickets(
  sprintId: string,
  tickets: ExtractedTicket[]
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const isAdmin = session.user.role === "admin";

    // Verify sprint access
    const sprint = await db.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            members: {
              where: { userId: session.user.id },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!sprint) return { success: false, error: "Sprint not found" };

    const hasAccess = isAdmin || sprint.project.members.length > 0;
    if (!hasAccess) return { success: false, error: "Unauthorized" };

    // Bulk create all tickets
    const created = await db.$transaction(
      tickets.map((ticket) =>
        db.task.create({
          data: {
            sprintId,
            title: ticket.title,
            description: ticket.description || "",
            type: ticket.type as TaskType,
            priority: (ticket.priority as TaskPriority) || "medium",
            status: "todo",
            requiredRole: ticket.requiredRole || undefined,
            labels: ticket.labels || [],
            createdBy: session.user.id,
          },
        })
      )
    );

    revalidatePath(`/projects`);

    return { success: true, count: created.length };
  } catch (error) {
    console.error("Failed to bulk create tickets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tickets",
    };
  }
}

import { db } from "@/server/db";
import { sendEmail } from "@/lib/email/client";
import {
  buildReviewerAssignedEmail,
  shouldNotifyReviewer,
} from "@/lib/email/templates";

/**
 * Sends the "you are the reviewer" email. Loads everything it needs from the
 * DB. Never throws — any failure is logged and swallowed so the calling
 * server action is unaffected.
 */
export async function notifyReviewerAssigned(args: {
  taskId: string;
  reviewerId: string | null;
  actingUserId: string;
}): Promise<void> {
  try {
    const reviewer = args.reviewerId
      ? await db.user.findUnique({
          where: { id: args.reviewerId },
          select: { id: true, name: true, email: true },
        })
      : null;

    if (
      !shouldNotifyReviewer({
        actingUserId: args.actingUserId,
        reviewerId: args.reviewerId,
        reviewerEmail: reviewer?.email ?? null,
      })
    ) {
      return;
    }

    const task = await db.task.findUnique({
      where: { id: args.taskId },
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        sprint: {
          select: { project: { select: { id: true, name: true } } },
        },
      },
    });

    const project = task?.sprint?.project;
    if (!task || !project) return;

    const assigner = await db.user.findUnique({
      where: { id: args.actingUserId },
      select: { name: true },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const taskUrl = `${baseUrl}/projects/${project.id}?task=${task.id}`;

    const { subject, html } = buildReviewerAssignedEmail({
      reviewerName: reviewer!.name,
      taskTitle: task.title,
      taskType: task.type as string,
      priority: task.priority as string | null,
      projectName: project.name,
      assignedByName: assigner?.name ?? null,
      taskUrl,
    });

    await sendEmail({ to: reviewer!.email, subject, html });
  } catch (err) {
    console.error("[email] notifyReviewerAssigned failed:", err);
  }
}

export interface ReviewerAssignedEmailInput {
  reviewerName: string | null;
  taskTitle: string;
  taskType: string;
  priority: string | null;
  projectName: string;
  assignedByName: string | null;
  taskUrl: string;
}

export function buildReviewerAssignedEmail(
  input: ReviewerAssignedEmailInput
): { subject: string; html: string } {
  const greetingName = input.reviewerName ?? "there";
  const assigner = input.assignedByName ?? "Someone";
  const subject = `You're the reviewer for "${input.taskTitle}"`;

  const priorityRow = input.priority
    ? `<tr><td style="padding:4px 0;color:#64748b;">Priority</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(
        input.priority
      )}</td></tr>`
    : "";

  const html = `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
      <h2 style="margin:0 0 12px;">You've been assigned as reviewer</h2>
      <p style="margin:0 0 16px;color:#334155;">Hi ${escapeHtml(
        greetingName
      )}, ${escapeHtml(
    assigner
  )} assigned you to review the following task.</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;color:#64748b;">Task</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(
          input.taskTitle
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Project</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(
          input.projectName
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Type</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(
          input.taskType
        )}</td></tr>
        ${priorityRow}
      </table>
      <a href="${input.taskUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">Review task</a>
    </div>
  </body>
</html>`;

  return { subject, html };
}

export function shouldNotifyReviewer(args: {
  actingUserId: string;
  reviewerId: string | null;
  reviewerEmail: string | null;
}): boolean {
  if (!args.reviewerId) return false;
  if (!args.reviewerEmail) return false;
  if (args.reviewerId === args.actingUserId) return false;
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

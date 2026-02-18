import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import crypto from "crypto";

/**
 * GitHub Webhook Handler
 * Receives events from GitHub when issues are closed/reopened
 * Updates the corresponding task's githubStatus in Nexus
 */

function verifySignature(payload: string, signature: string | null): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const digest = `sha256=${hmac.digest("hex")}`;

    try {
        return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    // Verify webhook signature if secret is configured
    if (process.env.GITHUB_WEBHOOK_SECRET) {
        if (!verifySignature(body, signature)) {
            console.error("[GitHub Webhook] Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
    }

    // Only handle issue events
    if (event !== "issues") {
        return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const payload = JSON.parse(body);
    const action = payload.action; // "closed", "reopened", "opened", etc.
    const issueId = payload.issue?.id;
    const issueNumber = payload.issue?.number;
    const repoFullName = payload.repository?.full_name;

    if (!issueId || !issueNumber) {
        return NextResponse.json({ error: "Missing issue data" }, { status: 400 });
    }

    console.log(`[GitHub Webhook] Issue #${issueNumber} ${action} in ${repoFullName}`);

    try {
        // Find the task by GitHub issue ID
        const task = await db.task.findFirst({
            where: { githubIssueId: BigInt(issueId) },
            select: { id: true, githubStatus: true },
        });

        if (!task) {
            // Try by issue number + repo
            const [owner, name] = (repoFullName || "").split("/");
            if (owner && name) {
                const taskByNumber = await db.task.findFirst({
                    where: {
                        githubIssueNumber: issueNumber,
                        sprint: {
                            project: {
                                githubRepoOwner: owner,
                                githubRepoName: name,
                            },
                        },
                    },
                    select: { id: true, githubStatus: true },
                });

                if (taskByNumber) {
                    await handleIssueAction(taskByNumber.id, action);
                    return NextResponse.json({ success: true, taskId: taskByNumber.id });
                }
            }

            console.log(`[GitHub Webhook] No matching task found for issue #${issueNumber}`);
            return NextResponse.json({ message: "No matching task" }, { status: 200 });
        }

        await handleIssueAction(task.id, action);
        return NextResponse.json({ success: true, taskId: task.id });
    } catch (error: any) {
        console.error("[GitHub Webhook] Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleIssueAction(taskId: string, action: string) {
    // Get current task status to prevent webhook loops
    const task = await db.task.findUnique({
        where: { id: taskId },
        select: { status: true, githubStatus: true, createdBy: true, title: true },
    });

    if (!task) return;

    if (action === "closed") {
        // If task is already "done" or "review" in Nexus, this close came FROM Nexus — skip
        if ((task.status === "done" || task.status === "review") && task.githubStatus === "closed") {
            console.log(`[GitHub Webhook] Task ${taskId} already ${task.status} — skipping (Nexus-originated close)`);
            return;
        }

        // Move task to "review" so the ticket creator can verify
        await db.task.update({
            where: { id: taskId },
            data: {
                status: "review",
                githubStatus: "closed",
                githubSyncedAt: new Date(),
            },
        });
        console.log(`[GitHub Webhook] Task ${taskId} moved to Review (dev closed issue)`);
    } else if (action === "reopened") {
        await db.task.update({
            where: { id: taskId },
            data: {
                status: "progress",
                githubStatus: "open",
                githubSyncedAt: new Date(),
            },
        });
        console.log(`[GitHub Webhook] Task ${taskId} moved back to In Progress (issue reopened)`);
    }
}

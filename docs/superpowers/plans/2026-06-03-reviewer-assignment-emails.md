# Reviewer-Assignment Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Email a user when they are set as the reviewer on a task, with a link that opens the task directly.

**Architecture:** A pure template/decision module (`lib/email/templates.ts`) builds the email and decides whether to send; a thin side-effecting client (`lib/email/client.ts`) sends via Resend and no-ops when unconfigured; an orchestrator (`lib/email/reviewer-assigned.ts`) loads the needed records and fires the send. Two server actions (`assignReviewer`, `updateTaskStatus`) call the orchestrator fire-and-forget via `waitUntil`. The kanban board reads a `?task=` query param to auto-open the task modal.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma, Resend, Vitest, `@vercel/functions` (`waitUntil`).

---

## File Structure

- **Create** `lib/email/templates.ts` — pure functions: `buildReviewerAssignedEmail()` (returns `{ subject, html }`) and `shouldNotifyReviewer()` (returns boolean). No env access, no `"use server"`. Directly unit-testable.
- **Create** `lib/email/client.ts` — `sendEmail({ to, subject, html })`. Lazily builds the Resend client from `RESEND_API_KEY`; no-ops with a single warning if the key is missing; never throws.
- **Create** `lib/email/reviewer-assigned.ts` — `notifyReviewerAssigned({ taskId, reviewerId, actingUserId })`. Loads task/project/reviewer/assigner, applies `shouldNotifyReviewer`, builds the email, calls `sendEmail`. Never throws.
- **Modify** `server/actions/tasks.ts` — call `notifyReviewerAssigned` from `assignReviewer` (~line 691) and `updateTaskStatus` (~line 280) via `waitUntil`.
- **Modify** `components/kanban/board.tsx` — add a `useSearchParams` effect to auto-open the modal for `?task=<id>`.
- **Modify** `.env.example` — document `RESEND_API_KEY` and `EMAIL_FROM`.
- **Modify** `package.json` — add `resend` dependency.
- **Create** `tests/unit/email-templates.test.ts` — tests for the two pure functions.
- **Create** `tests/unit/email-client.test.ts` — test that `sendEmail` no-ops without a key and never throws.

---

## Task 1: Add Resend dependency and env documentation

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install Resend**

Run:
```bash
npm install resend
```
Expected: `resend` appears under `dependencies` in `package.json`, lockfile updated.

- [ ] **Step 2: Document env vars in `.env.example`**

Append to `.env.example` (after the AI keys block):

```bash
# Email notifications (Resend) — optional.
# If RESEND_API_KEY is unset, email notifications are silently skipped.
RESEND_API_KEY=""
# Sender address. Use the Resend test sender until stanzasoft.ai is verified.
EMAIL_FROM="Nexus <onboarding@resend.dev>"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add resend dependency and email env vars"
```

---

## Task 2: Pure email template + decision functions

**Files:**
- Create: `lib/email/templates.ts`
- Test: `tests/unit/email-templates.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/email-templates.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildReviewerAssignedEmail,
  shouldNotifyReviewer,
} from "@/lib/email/templates";

describe("buildReviewerAssignedEmail", () => {
  const input = {
    reviewerName: "Asha",
    taskTitle: "Fix login redirect",
    taskType: "bug",
    priority: "high",
    projectName: "Nexus",
    assignedByName: "Vyshnavi",
    taskUrl: "https://app.example.com/projects/p1?task=t1",
  };

  it("puts the task title in the subject", () => {
    const { subject } = buildReviewerAssignedEmail(input);
    expect(subject).toContain("Fix login redirect");
  });

  it("includes the task link in the html", () => {
    const { html } = buildReviewerAssignedEmail(input);
    expect(html).toContain("https://app.example.com/projects/p1?task=t1");
  });

  it("includes project name and assigner in the html", () => {
    const { html } = buildReviewerAssignedEmail(input);
    expect(html).toContain("Nexus");
    expect(html).toContain("Vyshnavi");
  });

  it("omits the priority row when priority is null", () => {
    const { html } = buildReviewerAssignedEmail({ ...input, priority: null });
    expect(html).not.toContain("Priority");
  });
});

describe("shouldNotifyReviewer", () => {
  it("returns true for a normal assignment", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: "u2",
        reviewerEmail: "u2@x.com",
      })
    ).toBe(true);
  });

  it("returns false when assigning yourself", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: "u1",
        reviewerEmail: "u1@x.com",
      })
    ).toBe(false);
  });

  it("returns false when reviewerId is null", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: null,
        reviewerEmail: "u2@x.com",
      })
    ).toBe(false);
  });

  it("returns false when reviewer has no email", () => {
    expect(
      shouldNotifyReviewer({
        actingUserId: "u1",
        reviewerId: "u2",
        reviewerEmail: null,
      })
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: FAIL — cannot resolve `@/lib/email/templates`.

- [ ] **Step 3: Write the implementation**

Create `lib/email/templates.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/email-templates.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/email/templates.ts tests/unit/email-templates.test.ts
git commit -m "feat: add reviewer-assigned email template and send-decision helper"
```

---

## Task 3: Resend client wrapper

**Files:**
- Create: `lib/email/client.ts`
- Test: `tests/unit/email-client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/email-client.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sendEmail } from "@/lib/email/client";

describe("sendEmail", () => {
  const original = process.env.RESEND_API_KEY;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original;
  });

  it("resolves without throwing when no API key is configured", async () => {
    await expect(
      sendEmail({ to: "a@x.com", subject: "hi", html: "<p>hi</p>" })
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/email-client.test.ts`
Expected: FAIL — cannot resolve `@/lib/email/client`.

- [ ] **Step 3: Write the implementation**

Create `lib/email/client.ts`:

```typescript
import { Resend } from "resend";

let warned = false;

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!warned) {
      console.warn("[email] RESEND_API_KEY not set — skipping email send.");
      warned = true;
    }
    return;
  }

  const from = process.env.EMAIL_FROM ?? "Nexus <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/email-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email/client.ts tests/unit/email-client.test.ts
git commit -m "feat: add Resend email client that no-ops when unconfigured"
```

---

## Task 4: Reviewer-assigned orchestrator

**Files:**
- Create: `lib/email/reviewer-assigned.ts`

- [ ] **Step 1: Write the implementation**

Create `lib/email/reviewer-assigned.ts`:

```typescript
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
      taskType: task.type,
      priority: task.priority,
      projectName: project.name,
      assignedByName: assigner?.name ?? null,
      taskUrl,
    });

    await sendEmail({ to: reviewer!.email, subject, html });
  } catch (err) {
    console.error("[email] notifyReviewerAssigned failed:", err);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors related to `lib/email/reviewer-assigned.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/email/reviewer-assigned.ts
git commit -m "feat: add reviewer-assigned email orchestrator"
```

---

## Task 5: Wire orchestrator into server actions

**Files:**
- Modify: `server/actions/tasks.ts`

- [ ] **Step 1: Add the import**

In `server/actions/tasks.ts`, after the existing `syncTaskToGitHub` import (line 9), add:

```typescript
import { notifyReviewerAssigned } from "@/lib/email/reviewer-assigned";
```

- [ ] **Step 2: Fire from `assignReviewer`**

In `assignReviewer`, immediately before `return updatedTask;` (currently ~line 691), add:

```typescript
  if (reviewerId) {
    waitUntil(
      notifyReviewerAssigned({
        taskId,
        reviewerId,
        actingUserId: session.user.id,
      })
    );
  }
```

- [ ] **Step 3: Fire from `updateTaskStatus`**

In `updateTaskStatus`, immediately before `return updatedTask;` (currently ~line 281), add:

```typescript
  if (newStatus === "review" && reviewerId) {
    waitUntil(
      notifyReviewerAssigned({
        taskId,
        reviewerId,
        actingUserId: session.user.id,
      })
    );
  }
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add server/actions/tasks.ts
git commit -m "feat: send reviewer email on assignReviewer and review-status moves"
```

---

## Task 6: Auto-open task modal from `?task=` deep link

**Files:**
- Modify: `components/kanban/board.tsx`

- [ ] **Step 1: Import `useSearchParams`**

Change line 4 of `components/kanban/board.tsx` from:

```typescript
import { useRouter } from "next/navigation";
```
to:

```typescript
import { useRouter, useSearchParams } from "next/navigation";
```

- [ ] **Step 2: Read the param and add the auto-open effect**

In the `KanbanBoard` component body, just after the `const router = useRouter();` line (line 86), add:

```typescript
  const searchParams = useSearchParams();
```

Then, after the `selectedTask` / `isDetailModalOpen` state declarations (after line 91), add:

```typescript
  const [autoOpenedTaskId, setAutoOpenedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId || taskId === autoOpenedTaskId) return;
    const match = tasks.find((t) => t.id === taskId);
    if (!match) return;
    setSelectedTask(match);
    setIsDetailModalOpen(true);
    setAutoOpenedTaskId(taskId);
  }, [searchParams, tasks, autoOpenedTaskId]);
```

(The `autoOpenedTaskId` guard ensures we open the modal once; if the user closes it, we do not re-open it for the same param.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev`
Visit a project page with `?task=<an existing task id>` appended to the URL.
Expected: the task detail modal opens automatically for that task. Removing the param and reloading does not auto-open anything.

- [ ] **Step 5: Commit**

```bash
git add components/kanban/board.tsx
git commit -m "feat: auto-open task modal from ?task= deep link"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: all suites pass, including the two new email suites.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual end-to-end (requires `RESEND_API_KEY` set locally)**

1. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`.
2. `npm run dev`.
3. Assign another user (with a real email) as reviewer on a task — via the reviewer picker and by moving a ticket to "Review".
4. Confirm an email arrives at the reviewer's address.
5. Click "Review task" — confirm it opens the correct task modal on the project page.
6. Assign yourself as reviewer — confirm NO email is sent.

- [ ] **Step 4: Deploy**

```bash
git push origin main
npx vercel --prod --yes
```
Note: add `RESEND_API_KEY` and `EMAIL_FROM` to the Vercel project env before relying on production sends.

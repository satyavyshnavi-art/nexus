# Reviewer-Assignment Email Notifications — Design

**Date:** 2026-06-03
**Status:** Approved, ready for implementation plan

## Goal

When a user is set as the **reviewer** on a task, send that reviewer an email
notifying them, with a link that opens the task directly.

Scope is **reviewer assignment only**. Assignee notifications, comment/mention
notifications, and status-change notifications are explicitly out of scope.

## Provider

Resend.

- New dependency: `resend`.
- New env vars:
  - `RESEND_API_KEY` — set by the user (Resend account already to be created).
  - `EMAIL_FROM` — sender address. Default `Nexus <onboarding@resend.dev>`
    until the `stanzasoft.ai` domain is verified in Resend.
- Reuse existing `NEXTAUTH_URL` as the app base URL for building links.
- Add these to `.env.example` with comments.

## Components

### `lib/email/client.ts`
- Lazily constructs and memoizes a `Resend` client from `RESEND_API_KEY`.
- If `RESEND_API_KEY` is unset, exports a no-op send path so local/dev and the
  distributable clone never break. A missing key logs a warning once and
  returns without throwing.

### `lib/email/reviewer-assigned.ts`
- `sendReviewerAssignedEmail({ reviewer, task, project, assignedBy })`.
- Inputs (minimal, resolved by the caller):
  - `reviewer`: `{ email: string; name: string | null }`
  - `task`: `{ id: string; title: string; type: string; priority: string | null }`
  - `project`: `{ id: string; name: string }`
  - `assignedBy`: `{ name: string | null }`
- Builds a simple HTML email:
  - Subject: `You're the reviewer for "<task title>"`
  - Body: heading "You've been assigned as reviewer", task title, project name,
    task type, priority (if present), who assigned it.
  - A **Review task** button linking to:
    `${NEXTAUTH_URL}/projects/${project.id}?task=${task.id}`
- Wrapped in try/catch internally; on failure it logs and returns — it must
  never throw into the caller.

## Trigger points

Both live in `server/actions/tasks.ts`. In each case, after the DB write
succeeds, resolve the reviewer's email + the assigner's name, then call
`sendReviewerAssignedEmail` fire-and-forget (do not block or fail the action on
email errors).

1. **`assignReviewer(taskId, reviewerId)`** (~line 662)
   - Fires when `reviewerId` is a non-null value (a reviewer is being set, not
     cleared).
2. **`updateTaskStatus(taskId, newStatus, reviewerId)`** (~line 220)
   - Fires only when `newStatus === "review"` **and** a `reviewerId` is present
     (the path that writes `reviewerId` to the task at ~line 248).

### Self-assignment suppression
If the acting user (from session) is the same person as the reviewer, do **not**
send an email.

## Deep-link auto-open

The project page (`app/(dashboard)/projects/[projectId]/page.tsx`) is a server
component; the task modal is owned by the client component
`components/kanban/board.tsx` (`selectedTask` state at ~line 90, modal at
~line 664).

- Add a `useSearchParams` effect in `board.tsx`: on mount, if `?task=<id>`
  matches a loaded task in `tasks`, call `setSelectedTask(match)` and open the
  detail modal. Run once; do not re-open if the user later closes it.
- If the id does not match any loaded task, do nothing (no error).

## Data flow

```
assignReviewer / updateTaskStatus(→review)
  → DB update (reviewerId set)
  → resolve reviewer {email,name}, assignedBy {name}, project {id,name}, task fields
  → if acting user !== reviewer:
        sendReviewerAssignedEmail(...)  // fire-and-forget, try/catch
  → existing revalidatePath / return (unchanged)
```

```
Reviewer clicks "Review task"
  → /projects/[projectId]?task=[taskId]
  → board.tsx useSearchParams effect matches task → opens TaskDetailModal
```

## Error handling

- Missing `RESEND_API_KEY`: no-op send, single warning log. Assignment still
  succeeds.
- Resend API error / network failure: caught and logged inside the email
  module; assignment action is unaffected.
- Reviewer has no email on record: skip send (guard before calling Resend).

## Testing

- Unit: `sendReviewerAssignedEmail` builds correct subject/recipient/link; no-op
  when key missing; never throws on Resend failure (mock the client).
- Unit: trigger logic — email sent on reviewer set, NOT sent when reviewer
  cleared, NOT sent on self-assignment, NOT sent on non-review status changes.
- Manual: assign a reviewer in the live app, confirm email arrives and the
  "Review task" link opens the correct task modal.

## Out of scope

- Assignee (non-reviewer) notifications.
- Comment/mention and status-change emails.
- In-app notification center.
- Email open/click tracking.
- Domain verification for `stanzasoft.ai` (can be done later by swapping
  `EMAIL_FROM`).

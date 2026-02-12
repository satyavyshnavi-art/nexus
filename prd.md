# AI-First Project Management Portal (Lean Execution OS) — Execution-Ready PRD

## Document control
- **Owner:** Product + Architecture (Senior PM / Technical Architect)
- **Target users:** Internal teams (Admins + Members)
- **Product type:** Internal web portal
- **MVP scope:** Strictly limited to modules A–I as provided (no analytics dashboards, no external integrations, no complex role hierarchies).  
- **Non-goal:** A Jira replacement. This is a lean execution OS focused on predictable structure and low cognitive load.

---

# 1) Product mission & principles

## Mission
Build a minimal, clean, AI-assisted internal project management portal that acts as a unified workspace for organizational execution.

## Principles (non-negotiable)
- **Simplicity & predictability:** few core objects, consistent flows, minimal configuration.
- **Strong typing & normalized data:** schema-first, ENUM-safe statuses/priorities/types.
- **Modular architecture:** strict separation of UI vs business logic.
- **Scalable foundations:** folder structure, RBAC checks, DB indexes, and API conventions that allow future module growth without rewrites.
- **AI is assistive, not authoritative:** AI outputs must be validated and never bypass policy or authorization.

---

# 2) Goals, success criteria, non-goals

## Goals
1. Users can reliably execute sprint work using Projects → Sprints → Tasks → Kanban flow.
2. Admins can create projects/sprints; members can view/act only where assigned.
3. AI can generate sprint backlogs from text and classify bug priority, with structured JSON-only outputs.
4. File attachments can be uploaded securely via signed URLs and stored as metadata.

## Success criteria (MVP)
- **Time-to-first-task:** A new user can log in and move a task across Kanban within 3 minutes (assuming assigned to a project).
- **Sprint creation success rate:** > 95% successful without admin support.
- **AI sprint generation validation pass rate:** > 90% valid JSON schema on first attempt; > 99% after retries.
- **Kanban move latency:** perceived < 300ms with optimistic updates.

## Explicit non-goals (MVP lock)
- Analytics dashboards, external integrations (Slack/Jira/GitHub), marketing modules
- Complex role hierarchies beyond admin/member
- Multi-workspace tenancy beyond “verticals” grouping
- Advanced workflow automation rules

---

# 3) Personas & roles

## Roles (ENUM)
- **admin**
  - Can create projects, create/activate sprints, manage membership/vertical assignment.
- **member**
  - Can view assigned projects, create/update tasks (within authorization rules), move tasks, comment, upload attachments (if allowed by project membership).

## Typical personas
- **Ops/Admin Lead (Admin):** creates projects, manages sprint cycles, runs AI sprint generation.
- **Engineer/Contributor (Member):** moves tasks, adds comments, creates bugs, uploads files.
- **PM/Coordinator (could be Admin or Member):** uses AI sprint planning and ensures tasks are well structured.

---

# 4) User journeys (end-to-end)

## Journey 1 — First-time login → start working
1. User registers/logs in.
2. Lands on dashboard; system fetches **current user** and **user verticals**.
3. User selects a vertical (dropdown).
4. System lists projects available in that vertical (based on membership and role).
5. User opens a project → sees active sprint (if any) and Kanban board.
6. User moves a task from **Todo → In Progress** via drag & drop.
7. System performs optimistic update, then persists status change.

**Edge cases**
- User has **no verticals assigned** → show “Contact admin” state.
- User has verticals but **no projects** → empty state + admin CTA (only visible for admin).
- Project has **no active sprint** → show “No active sprint” state and sprint creation CTA for admin.

---

## Journey 2 — Admin creates project → adds members
1. Admin selects a vertical.
2. Admin creates a project with name/description.
3. Admin adds members to the project.
4. Members can now see the project in that vertical.

**Edge cases**
- Admin tries to add user not in the same vertical → block (or allow with automatic vertical assignment only if explicitly designed; default MVP: block).
- Duplicate membership insertion → idempotent behavior (no error, return existing).

---

## Journey 3 — Sprint lifecycle (planned → active → completed)
1. Admin opens project → creates sprint with name + start/end dates (status=planned).
2. Admin activates sprint.
3. System enforces only **one active sprint per project**.
4. Admin later completes sprint (status=completed), optionally leaving tasks in board state.

**Edge cases**
- Activate sprint when another active sprint exists → fail with “conflict” response; UI offers to complete/deactivate the current sprint first.
- Start/end dates invalid (end < start) → validation error.
- Activation when sprint has no tasks → allowed (lean), but warn.

---

## Journey 4 — AI sprint planning (text → backlog)
1. Admin (or permitted user) opens active or planned sprint screen and clicks “Generate Sprint Tasks”.
2. User enters feature description / requirements text.
3. Server calls LLM with low temperature and strict JSON schema.
4. Server validates response:
   - Required fields present
   - story_points numeric and within allowed range
   - tasks array non-empty (or allow empty but warn)
5. Server writes tasks into DB:
   - Creates “story” tasks and/or child tasks (see data modeling section)
6. UI refreshes Kanban with new tasks.

**Edge cases**
- Invalid JSON → retry policy (bounded) + show “couldn’t parse” message with safe fallback.
- Response contains unsafe/injection content → sanitize and store as plain text; never execute.
- Duplicate generation (user clicks twice) → use a “generation request idempotency key”.

---

## Journey 5 — Bug creation triggers AI priority classification
1. Member creates task with type=bug and provides description.
2. Server persists task as status=todo (default) + priority default (medium).
3. Server triggers AI classification:
   - synchronous if fast (<2–3s) or async job if needed (architecture supports both)
4. Server updates priority to high/critical/low based on classification.
5. UI shows updated priority badge.

**Edge cases**
- AI fails/timeouts → keep default priority and log event; optionally allow manual override.
- Description empty → skip AI and set default.

---

## Journey 6 — File attachment upload via signed URL
1. User clicks “Attach file” on task.
2. Client requests signed upload URL from server.
3. Client uploads directly to S3 using signed URL.
4. Client notifies server to save attachment metadata (file key/url, size, mime, task_id).
5. Attachment appears on task view.

**Edge cases**
- Upload fails mid-way → show retry; do not create metadata entry.
- Metadata save fails after upload → orphaned S3 object cleanup strategy (scheduled lifecycle rule).
- Unauthorized user tries to upload to task not in their project → deny at signed URL stage.

---

# 5) Functional requirements by module (deep execution detail)

## MODULE A — Authentication system

### Requirements
- Login page
- Register page
- Protected routes for dashboard and project areas
- Middleware must enforce authentication on protected segments

### Backend functions
- `authenticateUser(credentials)`  
  - Validates credentials with Cognito/Supabase
  - Creates session token / cookie
  - Returns user profile (id/email/role)
- `getCurrentUser()`  
  - Reads session, fetches user record (and minimal role info)
- `requireAuth()`  
  - Throws/redirects if not authenticated

### Authorization checks (cross-cutting)
- Every mutation must verify:
  1. authenticated
  2. role eligibility
  3. membership eligibility (vertical/project constraints)
  4. object ownership constraints (e.g., created_by where relevant if you choose to enforce)

### Edge cases
- Expired session → redirect to login; preserve intended redirect URL.
- Role missing/unknown → treat as member; log anomaly.
- Deleted user with active session → invalidate and redirect.

### Security
- HttpOnly cookies, CSRF strategy aligned with Next.js pattern (for server actions, ensure proper origin/csrf posture).
- Rate-limit login attempts at edge or auth provider.

---

## MODULE B — Vertical management

### Purpose
Group users into organizational units (“verticals”). User chooses active vertical context for browsing.

### Backend functions
- `createVertical(name)`  
  - Admin only
  - Enforce unique name (case-insensitive) or allow duplicates but discourage (MVP: unique per org)
- `assignUserToVertical(userId, verticalId)`  
  - Admin only
  - Insert into `vertical_users` (idempotent)
- `fetchUserVerticals(userId)`  
  - Returns list of verticals user belongs to

### UI expectations
- Vertical selector dropdown (persist last selection per user; store in DB or user preference cookie/local storage)
- If only one vertical, auto-select.

### Edge cases
- User removed from selected vertical mid-session → force reselect.
- Admin assigns user to vertical but user record missing → fail.

### Scalability
- Index `vertical_users(user_id)` and `vertical_users(vertical_id)`
- Cache `fetchUserVerticals` for session duration

---

## MODULE C — Project system

### Responsibilities
Projects are containers for sprints and tasks. Visibility is vertical + membership gated.

### Backend functions
- `createProject({name, description, verticalId})`  
  - Admin only
  - created_by = admin user
- `getProjectsByVertical(verticalId, userId)`  
  - Admin: all projects in vertical  
  - Member: only projects where user is in `project_members`
- `addMemberToProject(projectId, userId)`  
  - Admin only (or project creator)
  - Requires user belongs to project’s vertical (default MVP)
  - Idempotent insert

### UI expectations
- Projects list filtered by selected vertical
- Project page shows active sprint + Kanban

### Edge cases
- Member tries to access project by URL without membership → 403 screen
- Project vertical changed (if ever allowed later) → membership reconciliation (future)

### Scalability
- Index `projects(vertical_id)`
- Index `project_members(project_id, user_id)` unique composite

---

## MODULE D — Sprint engine

### Purpose
Time-boxed windows inside a project.

### Backend functions
- `createSprint(projectId, {name, start_date, end_date})`
  - Admin only
  - status defaults to planned
  - Validations: end_date >= start_date
- `activateSprint(sprintId)`
  - Admin only
  - Enforce only one active sprint per project:
    - Transaction: check existing active sprint for project; if exists, fail with conflict
    - Update status to active
- `fetchActiveSprint(projectId)`
  - Returns active sprint or null

### Rules
- Only one active sprint per project.

### Edge cases
- Activating completed sprint → reject
- Completing sprint with in-progress tasks → allowed but warn (lean); tasks remain as-is

### Scalability
- Index `sprints(project_id, status)`
- Consider partial index on `(project_id)` where status=active

---

## MODULE E — Task system (core engine)

### Task entity behavior
Tasks are central. Types: story/task/bug. Status: todo/progress/review/done. Priority: low/medium/high/critical.

### Backend functions
- `createTask(payload)`
  - Validations:
    - title required
    - story_points numeric if provided; clamp range (e.g., 0–13 or 0–20)
    - assignee must be project member (if assigned)
  - Defaults:
    - status=todo
    - priority=medium (unless bug classification triggers)
- `updateTaskStatus(taskId, newStatus)`
  - Must be atomic DB update
  - Must verify user has project membership
- `updatePriority(taskId, newPriority)`
  - Admin or assignee (define policy; MVP suggestion: admin + creator + assignee)
- `assignUser(taskId, assigneeId)`
  - Verify assignee is project member
- `addComment(taskId, comment_text)`
  - Persist in `task_comments` with created_at

### Task modeling for AI sprint planning
Your schema currently has a single `tasks` table with `type` including `story` and a `story_points` field.  
To preserve your ideas and also support “story contains tasks”, you have two execution-safe options:

**Option A (recommended minimal change): add self-relation**
- Add `parent_task_id` (nullable) to `tasks`
  - Story: `type=story`, `parent_task_id=null`
  - Child tasks: `type=task`, `parent_task_id=<story.id>`
- Keeps “tasks as central entity” and supports nested tasks without creating new tables.

**Option B (new table): story_tasks**
- Add `story_id`, `task_id` join table for flexibility.
- More complex than needed for MVP.

MVP recommendation: **Option A** to keep normalized and minimal.

### Edge cases
- Concurrent status updates (two users drag same card):
  - Use optimistic UI but server authoritative
  - On conflict, return latest task state; UI rehydrates
- Assignee removed from project:
  - On fetch, show “unassigned (former member)” and set assignee_id null via admin action (future), or auto-null if strict
- Sprint deleted (future) and tasks reference it: soft-delete or restrict (future)

### Scalability
- Index `tasks(sprint_id, status)`
- Index `tasks(assignee_id)`
- Consider pagination or virtualized list for large boards

---

## MODULE F — Kanban board engine

### UI columns
- Todo
- In Progress
- Review
- Done

### Technical expectations
- dnd-kit drag-and-drop
- Optimistic UI update (instant movement)
- Server mutation after drop (`moveTask`)
- No business logic in UI components

### Server functions
- `moveTask(taskId, newStatus)`
  - Checks:
    - user authenticated
    - user is member of project containing task
    - newStatus is valid ENUM
  - Atomic update:
    - update tasks set status=newStatus, updated_at=now (add updated_at field recommended)
  - Return updated task

### Edge cases
- Drag to same column → no-op
- Network failure after optimistic move:
  - Revert UI state + toast
  - Retry on next interaction (optional)
- Task not found → revert + refresh

### Performance constraints
- < 300ms perceived delay:
  - Optimistic update is mandatory
  - Debounce repeated rapid moves (optional)
  - Use lightweight payloads for board fetch

---

## MODULE G — AI sprint planning engine

### Purpose
Convert feature description into sprint backlog.

### Server function
- `generateSprintTasks(inputText, projectId, sprintId, requestedByUserId, idempotencyKey)`

### Processing workflow
1. **AuthZ**
   - Require authenticated
   - Require admin (or a configurable permission; MVP: admin only to match creation powers)
   - Require user is in project (admin still must be in vertical context or membership—define consistently)
2. **Prompt construction**
   - Include:
     - Desired JSON schema
     - Constraints on story points
     - Task status default
     - Avoid duplicates and keep titles concise
3. **LLM call**
   - Server-side only
   - Low temperature
   - Timeout + retry policy
4. **Validation**
   - Parse JSON strictly
   - Validate with schema validator (zod on server is typical)
   - Enforce limits:
     - max stories count (e.g., 30)
     - max tasks per story (e.g., 20)
     - max title length (e.g., 120 chars)
5. **Persistence**
   - Use transaction:
     - Create story tasks (type=story)
     - Create child tasks (type=task, parent_task_id=story.id)
     - Assign sprint_id (and optionally created_by=requestedBy)
6. **Response**
   - Return created tasks summary (ids + titles + points)

### Expected AI response format (must remain)
```json
{
  "stories": [
    {
      "title": "...",
      "story_points": 5,
      "tasks": ["..."]
    }
  ]
}
```

### Edge cases & safeguards
- **Invalid JSON**: retry (e.g., up to 2 retries) with “return JSON only” reinforcement.
- **Schema mismatch**: same retry policy; if still fails, surface error and store request+failure for debugging.
- **Prompt injection**: treat inputText as untrusted; never allow it to alter system instructions; enforce server-side fixed system prompt and strict output parser.
- **Duplicate generation**: use idempotencyKey stored in DB to prevent double inserts on re-submits.
- **Huge input**: truncate inputText or summarize first (future). MVP: cap characters and show validation message.

### Scalability
- If generation requests increase:
  - Introduce async job queue (later) while keeping same API contract
  - Store generation request record and poll for completion (future extensibility)
- Rate limit per user/project to avoid runaway costs

---

## MODULE H — AI bug priority engine

### Purpose
Automatically classify severity when task.type=bug.

### Trigger rule (must remain)
- Trigger when `task.type = bug` on creation (or when changed to bug).

### Server function
- `classifyBugPriority(taskId, description)`
  - Call LLM server-side
  - Output must map to enum: low/medium/high/critical

### Classification rules (must remain)
- crash/payment/auth → high or critical
- UI/spacing → low

### Workflow
1. On `createTask` if type=bug:
   - Persist task with default priority=medium
2. Call `classifyBugPriority`:
   - If success: update priority
   - If failure: keep medium and log

### Edge cases
- Empty description: skip AI, keep medium
- LLM returns non-enum: coerce using mapping or retry once; else fallback
- User manually changes priority after AI update: system must respect manual edits (store `priority_source` as “manual/ai/default” recommended)

### Scalability
- Consider async classification to keep create-task fast; UI can show “Classifying…” badge

---

## MODULE I — File attachment system

### Purpose
Securely upload and associate files with tasks.

### Server functions
- `getSignedUploadUrl({taskId, fileName, mimeType, fileSize})`
  - AuthZ: user must have access to task’s project
  - Validate fileSize and mime allowlist
  - Return signed PUT URL + object key
- `saveAttachmentMetadata({taskId, key, url, fileName, mimeType, size})`
  - AuthZ again (never trust client)
  - Insert attachment record

### Required DB additions (minimal, normalized)
Add table `task_attachments`:
- id (uuid)
- task_id (fk)
- uploaded_by (fk users)
- s3_key
- file_name
- mime_type
- size_bytes
- created_at

### Edge cases
- Upload succeeded but metadata fails → orphan cleanup via S3 lifecycle rules (e.g., auto-delete unreferenced objects in a temp prefix after N days)
- User uploads same filename twice → allowed; key should be unique via UUID prefix
- Virus scanning (future): integrate later via async pipeline; MVP: not included

### Security
- Signed URLs must be short-lived
- Use prefixing: `org/<verticalId>/<projectId>/<taskId>/<uuid>-<filename>`
- Never expose AWS credentials client-side

---

# 6) System architecture assumptions

## Runtime & hosting
- Next.js App Router + TypeScript
- Server actions or API routes for mutations
- Postgres on AWS RDS
- S3 for file storage (signed uploads)
- Auth via AWS Cognito or Supabase Auth

## Layering rules (must remain)
- `/components` = UI only, no business logic
- `/server` = business logic and orchestration (DB + authz + AI)
- `/lib` = utilities/helpers
- Prisma as sole DB access layer

## Suggested high-level architecture
- **Client (Next.js RSC + minimal client state)**  
  - Kanban interactions only in client state
- **Server actions / API routes**  
  - AuthZ checks + business logic
- **Prisma ORM**  
  - Normalized schema + transactions
- **LLM provider (OpenAI/Claude)**  
  - JSON-only structured outputs + validation
- **S3**  
  - direct uploads + metadata persistence

---

# 7) API-level thinking (server actions / routes)

Even if implemented as server actions, define clear API contracts for engineering clarity.

## Auth
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/me`

## Verticals
- `POST /api/verticals`
- `POST /api/verticals/:verticalId/users/:userId`
- `GET /api/verticals/my`

## Projects
- `POST /api/projects`
- `GET /api/projects?verticalId=`
- `POST /api/projects/:projectId/members`

## Sprints
- `POST /api/projects/:projectId/sprints`
- `POST /api/sprints/:sprintId/activate`
- `GET /api/projects/:projectId/sprints/active`

## Tasks
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId/status`
- `PATCH /api/tasks/:taskId/priority`
- `PATCH /api/tasks/:taskId/assignee`
- `POST /api/tasks/:taskId/comments`
- `GET /api/sprints/:sprintId/tasks` (board fetch)

## Kanban move
- `POST /api/tasks/:taskId/move` (wraps status update; same as update status but semantic)

## AI
- `POST /api/ai/sprint-generate`
- `POST /api/ai/bug-classify` (usually internal trigger)

## Attachments
- `POST /api/tasks/:taskId/attachments/sign`
- `POST /api/tasks/:taskId/attachments`

**Common response patterns**
- 200 OK with payload
- 400 validation errors (field-level)
- 401 unauthenticated
- 403 unauthorized
- 404 not found
- 409 conflict (e.g., sprint activation conflict)
- 429 rate limited
- 500 unexpected

---

# 8) Database entities & schema suggestions

You provided a strict contract; keep it. Add only minimal fields/tables needed for correctness and extensibility.

## Existing tables (keep)
- users
- verticals
- vertical_users
- projects
- project_members
- sprints
- tasks
- task_comments

## Strongly recommended additive fields (minimal)
These improve concurrency, auditing, and UI correctness:
- `tasks.updated_at`
- `tasks.created_at` (already have created_by; timestamp helps)
- `projects.created_at`
- `sprints.created_at`
- `task_comments.updated_at` (optional)

## For nested “story contains tasks” (recommended)
- `tasks.parent_task_id` nullable self-FK  
  - Index `tasks(parent_task_id)`
  - Enforce `parent_task_id` only when parent.type=story (application-level validation)

## For attachments (required by Module I)
- `task_attachments` table as described above

## Enum definitions (must be ENUM-safe)
- user.role: admin | member
- sprint.status: planned | active | completed
- task.status: todo | progress | review | done
- task.priority: low | medium | high | critical
- task.type: story | task | bug

## Constraints & indexes (execution-ready)
- Unique:
  - `users.email`
  - `project_members(project_id, user_id)`
  - `vertical_users(vertical_id, user_id)`
- Index:
  - `projects.vertical_id`
  - `sprints.project_id`
  - `sprints(project_id, status)`
  - `tasks.sprint_id`
  - `tasks(assignee_id)`
  - `tasks(status)` (optional; depends on query patterns)
  - `task_comments.task_id`
  - `task_attachments.task_id`

---

# 9) Failure scenarios & resilience

## AI failures
- **Invalid JSON**: retry with stricter prompt; if still fails, show error and do not write tasks.
- **Timeout**: return “AI busy” and let user retry; log for alerting.
- **Partial/empty stories**: validation rejects or warns; do not create empty titles.
- **Cost spikes**: rate limit AI calls per user/day (config).

## Drag/drop concurrency
- **Two users move same task simultaneously**:
  - Server last-write-wins (acceptable MVP)
  - Return updated task state; client reconciles

## Auth/permissions
- Access a project without membership: 403
- User removed from membership mid-session: all mutations fail; UI shows “access changed” + refresh.

## S3 upload
- Signed URL expires before upload finishes: request new URL.
- Upload succeeds but metadata fails: orphan object cleanup strategy.

## DB outages
- Read-only fallback states:
  - Show “system unavailable” and disable mutations
  - Ensure errors are user-friendly but non-revealing

---

# 10) Security considerations

## Core security rules (must remain)
- Never expose AI keys client-side.
- Validate role before mutations.
- Use signed S3 uploads.

## Additional security requirements
- **Authorization is object-level**, not just role-level:
  - Must verify vertical membership and project membership for reads/writes
- **Input validation**
  - All server actions validate payloads (zod or equivalent)
  - Prevent oversized payloads (comments length, task descriptions)
- **Auditability**
  - Store created_by for projects/sprints/tasks/comments/attachments
- **Secrets management**
  - Use server env vars, rotate keys, restrict IAM policies for S3 signing
- **S3 policy**
  - Use least privilege IAM for signing
  - Bucket private; access via signed GET (future) if downloads needed

---

# 11) Analytics, events, and KPIs (instrumentation without dashboards)

You cannot add analytics dashboards in MVP, but you can (and should) instrument events for later.

## Key product metrics (KPIs)
- Activation:
  - % users who select a vertical and open a project within first session
- Engagement:
  - Tasks moved per active user per week
  - Comments per task
- Execution health:
  - Sprint tasks created vs completed
  - Cycle time proxy (todo → done duration; requires timestamps on status changes—future)
- AI utility:
  - AI generation usage rate
  - AI JSON validation pass rate (first attempt / after retries)
  - AI bug classification adoption rate

## Suggested event schema
Event table `events` (optional in MVP; can be logs only). If DB events are allowed later:
- id
- user_id
- event_name
- entity_type/entity_id
- metadata JSONB (small)
- created_at

## Minimum required logging (MVP)
- AI calls: request id, success/fail, latency, validation outcome
- Kanban move: task_id, from_status, to_status, latency
- Auth failures and permission denials (without sensitive details)

---

# 12) Performance & scalability considerations

## Performance targets (must remain + refined)
- Kanban perceived latency: < 300ms using optimistic UI
- AI generation: under 5 seconds target; if exceeded, degrade gracefully
- Lazy load heavy components: Kanban dnd logic client-only

## Scalability strategies (MVP-friendly)
- Pagination/virtualization on Kanban when tasks > N (e.g., 200)
- Cache read-heavy endpoints for session duration:
  - current user
  - verticals list
  - project list for selected vertical
- DB transactions for sprint activation and AI task inserts

---

# 13) UX requirements (lean, consistent)

## Information hierarchy
- Dashboard: Vertical selector → Projects list
- Project: Sprint summary + Kanban board
- Task detail: description, comments, attachments, metadata (priority/type/assignee/story points)

## Consistency rules
- Same status labels and colors across UI (use enums)
- No hidden automation; AI actions are explicit except bug priority trigger (which should still be visible as “AI-classified”)

---

# 14) Acceptance criteria (module-level)

## Auth
- ✅ Unauthenticated user cannot access any dashboard route.
- ✅ Authenticated user sees dashboard and their vertical list.
- ✅ Session persists across refresh.

## Verticals
- ✅ User sees only their verticals.
- ✅ Admin can create vertical and assign users.
- ✅ Selecting vertical filters projects.

## Projects
- ✅ Admin can create project in a vertical.
- ✅ Member sees only projects they are assigned to.
- ✅ Unauthorized access by URL returns 403.

## Sprints
- ✅ Admin can create sprint.
- ✅ Only one active sprint enforced at DB transaction level.
- ✅ Active sprint fetch returns correct sprint or null.

## Tasks
- ✅ Create/update task with enum-safe fields.
- ✅ Status update is atomic.
- ✅ Assignments only to project members.
- ✅ Comments persist with author and timestamp.

## Kanban
- ✅ Drag moves update UI instantly; persisted on server.
- ✅ Failure reverts UI and shows error.

## AI sprint generation
- ✅ Only server-side LLM call.
- ✅ JSON schema validation required.
- ✅ Inserts tasks transactionally.
- ✅ Invalid responses retry then fail gracefully.

## AI bug priority
- ✅ Triggered on bug creation.
- ✅ Updates enum priority.
- ✅ Failure leaves default priority.

## Attachments
- ✅ Signed upload URL requires authz.
- ✅ Upload stores metadata and displays attachment.

---

# 15) Future extensibility (explicit hooks without building now)

While MVP is locked, design should not block:
- More roles/permissions (project-level roles)
- Multiple active sprints via lanes (future)
- Task status history (for cycle time analytics)
- AI “task refinement” (rewrite descriptions, acceptance criteria) with same structured output pattern
- Integrations (GitHub issues sync) later
- Full-text search across tasks/comments/attachments metadata
- Notifications

---

# 16) Engineering execution plan (generation order must remain)

Mandatory build order (as provided):
1. Prisma schema
2. Database models
3. Auth middleware
4. Vertical module
5. Project module
6. Sprint module
7. Task engine
8. Kanban board UI
9. AI sprint planner
10. AI bug priority system

**Add within this order where necessary** (does not violate order):
- Attachments can be implemented after task engine (since it depends on tasks), before/after Kanban UI.

---

# 17) Open questions (kept minimal; resolve by sensible defaults)

To proceed without ambiguity, adopt these defaults unless you decide otherwise:
- **Who can create tasks?** Default: any project member.
- **Who can run AI sprint generation?** Default: admin only.
- **Can members change priority?** Default: admin + assignee + creator.
- **Story/task relationship:** Default: `parent_task_id` self-relation.

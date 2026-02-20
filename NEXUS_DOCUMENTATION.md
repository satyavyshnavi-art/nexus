# Nexus - AI-First Project Management Portal

## Complete End-to-End Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [Core Features](#6-core-features)
7. [AI Integration](#7-ai-integration)
8. [GitHub Integration](#8-github-integration)
9. [File Storage](#9-file-storage)
10. [Server Actions](#10-server-actions)
11. [Components Library](#11-components-library)
12. [Routing & Pages](#12-routing--pages)
13. [Styling & Theming](#13-styling--theming)
14. [Performance Optimizations](#14-performance-optimizations)
15. [Environment Variables](#15-environment-variables)
16. [Deployment](#16-deployment)
17. [Setup Guide](#17-setup-guide)
18. [Business Rules](#18-business-rules)
19. [Security](#19-security)
20. [Testing](#20-testing)

---

## 1. Project Overview

**Nexus** is a modern, AI-powered project management portal designed for teams to plan sprints, manage tasks, and collaborate — with AI assistance built into the workflow.

### Mission
Build a minimal, clean, AI-assisted internal project management portal for organizational execution.

### Core Principles
- **Simplicity & predictability** — no over-engineering
- **Strong typing & normalized data** — full TypeScript + Prisma
- **Modular architecture** — UI and business logic are separated
- **Scalable foundations** — indexed database, cached queries
- **AI is assistive, not authoritative** — AI suggests, humans decide

### What Nexus Does
- Organize teams into **Verticals** (departments/divisions)
- Create **Projects** within verticals
- Plan work using **Sprints** with defined timelines
- Track work with **Tasks** on a Kanban board (drag-and-drop)
- Use **AI to auto-generate sprint backlogs** from plain English descriptions
- Use **AI to auto-classify bug severity** when bugs are created
- **Sync tasks with GitHub Issues** bidirectionally
- **Upload file attachments** to tasks via Cloudflare R2 storage
- **Role-based access** — Admins manage everything, Members work on assigned projects

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Language** | TypeScript 5.9 | Type safety |
| **UI Library** | React 19 | Component rendering |
| **Database** | PostgreSQL (Neon Serverless) | Data persistence |
| **ORM** | Prisma 5.22 | Database queries & migrations |
| **Auth** | NextAuth.js v5 | Authentication & sessions |
| **AI (Primary)** | Google Gemini 2.5 Flash | Sprint generation, bug classification |
| **AI (Secondary)** | Anthropic Claude Sonnet 4.5 | Structured output generation |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix UI | Accessible component library |
| **Drag & Drop** | dnd-kit | Kanban board interactions |
| **File Storage** | Cloudflare R2 (S3-compatible) | Task attachments |
| **GitHub API** | Octokit | Issue sync & repo management |
| **Encryption** | AES-256-GCM | GitHub token encryption |
| **Deployment** | Vercel | Hosting & CI/CD |
| **Domain** | GoDaddy | Custom domain management |

### Key Dependencies
```json
{
  "@anthropic-ai/sdk": "^4.6.0",
  "@google/generative-ai": "^0.24.0",
  "@dnd-kit/core": "^6.3.1",
  "@aws-sdk/client-s3": "^3.750.0",
  "next-auth": "^5.0.0-beta.25",
  "prisma": "^5.22.0",
  "bcrypt": "^5.1.1",
  "zod": "^3.24.2",
  "sonner": "^2.0.3",
  "next-themes": "^0.4.6",
  "lucide-react": "^0.475.0"
}
```

---

## 3. Architecture

### Directory Structure
```
nexus/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public auth pages (login, register)
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── admin/                # Admin-only pages
│   │   │   ├── projects/         # Manage projects
│   │   │   ├── users/            # Manage users
│   │   │   └── verticals/        # Manage verticals
│   │   ├── projects/[projectId]/ # Project detail + sprints
│   │   ├── team/                 # Team directory
│   │   ├── team-members/[id]/    # Individual member profile
│   │   ├── profile/              # Current user profile
│   │   ├── settings/             # User settings
│   │   ├── layout.tsx            # Dashboard layout (nav, auth check)
│   │   ├── loading.tsx           # Dashboard skeleton
│   │   └── page.tsx              # Dashboard home
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   └── github/webhook/       # GitHub webhook endpoint
│   ├── layout.tsx                # Root layout (providers, fonts)
│   └── globals.css               # Global styles & theme variables
│
├── components/                   # UI Components (NO business logic)
│   ├── ui/                       # shadcn base components (30+ files)
│   ├── kanban/                   # Kanban board (board, column, task-card)
│   ├── tasks/                    # Task components (24 files)
│   ├── sprints/                  # Sprint components (8 files)
│   ├── projects/                 # Project components (6 files)
│   ├── admin/                    # Admin components (17 files)
│   ├── layout/                   # Nav, mobile menu, user menu
│   ├── dashboard/                # Dashboard grid & stats
│   ├── team/                     # Team cards & grid
│   ├── profile/                  # Profile forms & avatar
│   ├── settings/                 # Settings panels
│   ├── auth/                     # Login & register forms
│   ├── command-menu.tsx          # Omni-search command palette
│   └── theme-toggle.tsx          # Dark/light mode toggle
│
├── server/                       # Business Logic Layer
│   └── actions/                  # Server actions
│       ├── auth.ts               # Registration
│       ├── projects.ts           # Project CRUD, member management
│       ├── sprints.ts            # Sprint CRUD, activate/complete
│       ├── tasks.ts              # Task CRUD, status updates, AI classify
│       ├── users.ts              # User management, profiles
│       ├── verticals.ts          # Vertical CRUD
│       ├── team.ts               # Team stats & member queries
│       ├── settings.ts           # User settings (notifications, theme)
│       ├── github-sync.ts        # Task ↔ GitHub issue sync
│       └── github-link.ts        # Link projects to GitHub repos
│
├── lib/                          # Utilities & Helpers
│   ├── auth/
│   │   ├── config.ts             # NextAuth configuration
│   │   └── helpers.ts            # Auth helper functions
│   ├── ai/
│   │   ├── claude.ts             # Anthropic Claude client
│   │   ├── gemini.ts             # Google Gemini client
│   │   ├── sprint-generator.ts   # AI sprint backlog generation
│   │   └── bug-classifier.ts     # AI bug priority classification
│   ├── github/
│   │   ├── client.ts             # Octokit client factory
│   │   └── sync.ts               # GitHub issue create/update/close
│   ├── storage/
│   │   └── s3-client.ts          # S3/R2 signed URL generation
│   └── crypto/
│       └── encryption.ts         # AES-256-GCM encrypt/decrypt
│
├── prisma/
│   └── schema.prisma             # Database schema (single source of truth)
│
├── middleware.ts                  # Request middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── package.json                  # Dependencies & scripts
```

### Layering Rules (Strictly Enforced)
| Layer | Responsibility | Rules |
|-------|---------------|-------|
| `/components` | UI rendering only | No database queries, no business logic |
| `/server` | Business logic | Auth checks, DB queries, validation, AI calls |
| `/lib` | Utilities | Reusable helpers, API clients, encryption |
| `prisma` | Data layer | Sole database access — no raw SQL |

### Data Flow
```
User Action → Component → Server Action → Database
                                        → AI Service
                                        → GitHub API
                                        → S3 Storage
                          ↓
              revalidatePath() → Updated UI
```

---

## 4. Database Schema

### Entity Relationship Diagram
```
Users ──┬── VerticalUser ──── Verticals
        │                        │
        ├── ProjectMember ──── Projects ──── Sprints ──── Tasks
        │                        │                         │
        ├── TaskComment ─────────┼─────────────────────────┤
        ├── TaskAttachment ──────┼─────────────────────────┤
        └── GitHubSyncLog ───────┴─────────────────────────┘
```

### Models

#### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String (unique) | Login email |
| passwordHash | String? | bcrypt hash (null for GitHub-only users) |
| name | String? | Display name |
| role | admin / member | Access level |
| avatar | String? | Avatar URL |
| bio | String? | User biography |
| designation | String? | Job title |
| githubId | String? (unique) | GitHub OAuth ID |
| githubUsername | String? | GitHub username |
| githubAccessToken | String? | Encrypted GitHub token |
| theme | String | "system" / "light" / "dark" |
| viewDensity | String | "comfortable" / "compact" |
| *Notifications* | Boolean fields | email, task, comment, sprint, dailyDigest |

#### Vertical (Organizational Unit)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String (unique) | Vertical name (e.g., "Engineering") |
| projects | Project[] | Projects in this vertical |
| users | VerticalUser[] | Members assigned to this vertical |

#### Project
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Project name |
| description | String? | Project description |
| verticalId | FK → Vertical | Parent vertical |
| createdBy | FK → User | Creator |
| githubRepoOwner | String? | Linked GitHub repo owner |
| githubRepoName | String? | Linked GitHub repo name |
| githubRepoId | BigInt? | GitHub repo ID |
| members | ProjectMember[] | Assigned team members |
| sprints | Sprint[] | Project sprints |

#### Sprint
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| projectId | FK → Project | Parent project |
| name | String | Sprint name |
| startDate | DateTime | Sprint start |
| endDate | DateTime | Sprint end |
| status | planned / active / completed | Sprint lifecycle |
| createdBy | FK → User | Creator |
| tasks | Task[] | Tasks in this sprint |

**Business Rule:** Only ONE active sprint per project (enforced via database transaction).

#### Task
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| sprintId | FK → Sprint | Parent sprint |
| title | String | Task title |
| description | String? | Task description |
| type | story / task / bug | Task type |
| status | todo / progress / review / done | Current status |
| priority | low / medium / high / critical | Severity |
| storyPoints | Int? | Effort estimate (0-20) |
| assigneeId | FK → User? | Assigned member |
| createdBy | FK → User | Creator |
| parentTaskId | FK → Task? | Parent task (for subtasks) |
| githubIssueNumber | Int? | Linked GitHub issue number |
| githubUrl | String? | GitHub issue URL |
| githubStatus | String? | "open" / "closed" |
| comments | TaskComment[] | Task comments |
| attachments | TaskAttachment[] | File attachments |
| childTasks | Task[] | Subtasks |

#### TaskComment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| taskId | FK → Task | Parent task |
| userId | FK → User | Comment author |
| content | String | Comment text |

#### TaskAttachment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| taskId | FK → Task | Parent task |
| uploadedBy | FK → User | Uploader |
| s3Key | String | Storage path |
| fileName | String | Original filename |
| mimeType | String | File type |
| sizeBytes | Int | File size |

#### GitHubSyncLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| taskId | FK → Task? | Synced task |
| projectId | FK → Project | Project |
| action | String | create / update / close |
| status | String | success / failed |
| errorMessage | String? | Error detail |
| githubIssueNumber | Int? | Issue number |
| userId | FK → User | Who triggered sync |

### Database Indexes
| Model | Index | Purpose |
|-------|-------|---------|
| User | role | Filter by admin/member |
| Project | verticalId | Projects by vertical |
| Project | createdBy | Projects by creator |
| Project | verticalId + createdAt | Sorted vertical projects |
| Project | githubRepoOwner + githubRepoName | GitHub lookup |
| Sprint | projectId + status | Active sprint lookup |
| Task | sprintId + status | Kanban column queries |
| Task | assigneeId | Tasks by assignee |
| Task | createdBy | Tasks by creator |
| Task | parentTaskId | Subtask lookup |
| Task | githubIssueId | GitHub sync lookup |
| TaskComment | taskId + createdAt | Sorted comments |
| TaskComment | userId | Comments by user |
| GitHubSyncLog | projectId + createdAt | Recent sync logs |
| GitHubSyncLog | userId | Logs by user |

---

## 5. Authentication System

### Providers

#### 1. Email/Password (Credentials)
```
User enters email + password
  → bcrypt compare against stored hash
  → Return user object with id, email, name, role
  → JWT token created
```

#### 2. GitHub OAuth
```
User clicks "Sign in with GitHub"
  → Redirected to GitHub OAuth (scopes: read:user, user:email, repo)
  → GitHub returns access token + profile
  → Nexus checks: user exists by githubId? by email?
    → Yes: Update GitHub tokens (encrypted AES-256-GCM)
    → No: Create new user with role=member
  → Ensure user has vertical assignment (creates "Default" if needed)
  → JWT token created with real DB UUID
```

### Session Structure
```typescript
{
  user: {
    id: "uuid",          // Database UUID (NOT GitHub ID)
    email: "user@example.com",
    name: "John Doe",
    role: "admin" | "member",
    designation: "Software Engineer" | null
  },
  expires: "2026-03-20T..."
}
```

### Key Design Decisions
- **JWT strategy** — no database session table (faster, stateless)
- **GitHub tokens encrypted** — AES-256-GCM before storage in DB
- **UUID override** — GitHub OAuth returns provider ID, but JWT callback fetches real DB UUID
- **Default vertical** — new GitHub users auto-assigned to "Default" vertical
- **Auth enforcement** — done at page/server-action level, not middleware

---

## 6. Core Features

### 6.1 Kanban Board
The heart of Nexus — a drag-and-drop task management board.

**How it works:**
- 4 columns: **To Do** → **In Progress** → **Review** → **Done**
- Drag tasks between columns to update status
- **Optimistic UI** — status updates instantly on drag, reverts on error
- Each task card shows: title, priority badge, assignee avatar, story points, type icon, comment/attachment counts
- Click a task to open the detail modal (dynamic import for performance)

**Tech:** dnd-kit with PointerSensor + TouchSensor (mobile support)

### 6.2 Sprint Management
Organize work into time-boxed sprints.

**Lifecycle:** `Planned` → `Active` → `Completed`

**Rules:**
- Only admins can create/activate/complete sprints
- Only ONE active sprint per project at any time
- Sprint has a name, start date, and end date
- Tasks belong to sprints

### 6.3 Task Management
Full task lifecycle with types, priorities, and hierarchy.

**Task Types:**
- **Story** — feature/user story that can have subtasks
- **Task** — individual work item
- **Bug** — defect (triggers AI priority classification)

**Task Statuses:** todo → progress → review → done

**Task Priorities:** low, medium, high, critical

**Features:**
- Create/edit tasks with title, description, type, priority, story points
- Assign tasks to team members
- Add comments to tasks
- Upload file attachments
- Create subtasks (parent-child hierarchy)
- Track subtask progress with progress bars

### 6.4 Team Management
Directory and profile system for team members.

- **Team Page** — grid of all team members with stats (projects, active tasks, completed tasks)
- **Member Profiles** — avatar, bio, designation, recent tasks
- **Role Management** — admins can toggle member ↔ admin roles
- **Vertical Assignment** — assign members to organizational verticals

### 6.5 Admin Dashboard
Admin-specific view with organizational overview.

- **Verticals & Projects** — grouped view of all verticals with nested projects
- **Quick Stats** — total projects, sprints, team members
- **Management Links** — direct access to manage verticals, projects, users
- **Role-based** — admins see verticals view, members see their projects

### 6.6 Command Palette
Global search and quick navigation (Cmd/Ctrl + K).

- Search projects, sprints, team members
- Quick navigation to any page
- Prefetches destinations on hover for instant navigation

### 6.7 Settings
User-customizable preferences.

- **Account** — name, email
- **Security** — change password
- **Notifications** — email, task, comment, sprint, daily digest toggles
- **Appearance** — theme (system/light/dark), view density (comfortable/compact)
- **GitHub** — connection status

---

## 7. AI Integration

### 7.1 AI Sprint Planning

**Purpose:** Generate a full sprint backlog from a natural language description.

**How it works:**
1. Admin enters a feature description in plain English
2. AI generates structured JSON with stories and tasks
3. Tasks are batch-inserted into the sprint via a database transaction

**Input Example:**
```
"Build a user authentication system with login, register,
password reset, and social login support"
```

**Output Schema:**
```json
{
  "stories": [
    {
      "title": "User Registration",
      "story_points": 5,
      "tasks": [
        {
          "title": "Create registration form with validation",
          "type": "task",
          "priority": "high",
          "story_points": 3
        }
      ]
    }
  ]
}
```

**Validation Rules:**
- story_points: 0-20 per item
- Max 30 stories per generation
- Max 20 tasks per story
- Validated against Zod schema

**AI Model:** Google Gemini 2.5 Flash (primary), Claude Sonnet 4.5 (secondary)
**Temperature:** 0.2 (low randomness for consistent output)

### 7.2 AI Bug Classification

**Purpose:** Automatically assign priority to bug reports.

**How it works:**
1. User creates a task with type = "bug"
2. AI analyzes the bug title + description
3. Priority is auto-assigned (runs async, non-blocking)

**Classification Rules:**
| Bug Contains | Priority |
|-------------|----------|
| Crash, data loss, payment, auth failure | **critical** |
| Security, performance, major feature broken | **high** |
| Minor feature issue, workaround exists | **medium** |
| UI/spacing, cosmetic, typo | **low** |

**Fallback:** If AI fails, keeps default priority (medium).

---

## 8. GitHub Integration

### 8.1 Repository Linking
- Admin links a project to a GitHub repository
- Requires GitHub OAuth with `repo` scope
- Stores repo owner, name, and ID in the Project model

### 8.2 Task → Issue Sync
When a task is synced to GitHub:
- Creates a GitHub Issue with the task title and description
- Maps Nexus labels to GitHub labels:
  - Type: `bug`, `enhancement`, `task`
  - Priority: `priority:critical`, `priority:high`, etc.
  - Status: `status:todo`, `status:progress`, etc.
- Sets assignee if the task assignee has a GitHub username
- Stores issue number and URL back in the task

### 8.3 Webhook (Issue → Task)
GitHub sends webhooks when issues change:
- **Issue closed** → Task status updated to "done", githubStatus = "closed"
- **Issue reopened** → Task githubStatus = "open"
- **Loop prevention** — 10-second cooldown check (`githubSyncedAt`)

### 8.4 Batch Sync
Admin can batch-sync all unsynced tasks in a project's active sprint to GitHub:
- Rate-limited: 1 second delay between syncs
- Reports success/failure counts

### 8.5 Token Strategy
GitHub API calls use this fallback chain:
1. **Current user's** encrypted token
2. **Project linker's** token (person who linked the repo)
3. **System bot token** (`GITHUB_ACCESS_TOKEN` env var)

---

## 9. File Storage

### Storage Provider
- **Cloudflare R2** (S3-compatible object storage)
- Accessed via `@aws-sdk/client-s3`

### How It Works
1. Client requests a signed upload URL from the server
2. Server generates a **signed PUT URL** (1 hour expiry) via S3 `PutObjectCommand`
3. Client uploads file directly to R2 (no server proxying)
4. Server creates a `TaskAttachment` record with metadata
5. Downloads use **signed GET URLs** (1 hour expiry)

### File Path Structure
```
tasks/{taskId}/{uuid}-{filename}
```

### Limits
- **Max file size:** 10 MB per file
- **Signed URL expiry:** 1 hour
- **Permissions:** Only the uploader or admin can delete

---

## 10. Server Actions

All business logic lives in `/server/actions/`. Each function follows this pattern:

```typescript
"use server";

export async function actionName(data) {
  // 1. Authentication check
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // 2. Authorization check (role + membership)
  if (session.user.role !== "admin") throw new Error("Unauthorized");

  // 3. Input validation
  // 4. Database operation (Prisma)
  // 5. Cache revalidation
  revalidatePath("/specific-path");

  return result;
}
```

### Actions by Module

| Module | Functions | Description |
|--------|----------|-------------|
| **auth.ts** | register | Create new user account |
| **projects.ts** | createProject, getProject, getUserProjects, getAllProjects, getProjectsByVertical, addMemberToProject, removeMemberFromProject, deleteProject, getProjectMemberData | Full project CRUD + member management |
| **sprints.ts** | createSprint, activateSprint, completeSprint, getActiveSprint, getProjectSprints | Sprint lifecycle management |
| **tasks.ts** | createTask, updateTask, updateTaskStatus, deleteTask, getTaskWithProgress, generateSprintTasks, addComment, getTaskComments, createAttachment, deleteAttachment, getUploadUrl, getDownloadUrl | Task CRUD, AI generation, comments, attachments |
| **users.ts** | getAllUsers, updateUserRole, getUserProfile, updateUserProfile, getCurrentUserProfile | User management + profiles |
| **verticals.ts** | createVertical, getAllVerticals, getVerticalWithUsers, getVerticalDetails, getVerticalsWithProjects, assignUserToVertical, removeUserFromVertical, updateVertical, deleteVertical, getUserVerticals | Vertical CRUD + member assignment |
| **team.ts** | getTeamMembers, getTeamStats, updateUserRole | Team directory + stats |
| **settings.ts** | getUserSettings, updateNotificationSettings, updateAppearanceSettings, updateAccountSettings, updatePassword, getGitHubConnectionStatus | User preferences |
| **github-sync.ts** | syncTaskToGitHub, batchSyncTasksToGitHub, getProjectSyncStatus, canSyncTasks | GitHub issue sync |
| **github-link.ts** | linkProjectToGitHub, unlinkProjectFromGitHub, getUserRepositories | Repo linking |

---

## 11. Components Library

### UI Base (shadcn/ui) — 30+ Components
Built on Radix UI primitives with Tailwind styling:

| Category | Components |
|----------|-----------|
| **Forms** | Input, Textarea, Label, Checkbox, Radio Group, Select, Switch |
| **Layout** | Card, Tabs, Breadcrumb, Dialog, Alert Dialog |
| **Feedback** | Badge, Button, Spinner, Skeleton, Empty State, Error Message |
| **Navigation** | Dropdown Menu, Command (palette) |
| **Display** | Avatar, Kbd (keyboard shortcut) |
| **Notifications** | Toast, Toaster (sonner) |

### Feature Components

| Area | Count | Key Components |
|------|-------|---------------|
| **Kanban** | 5 | Board, Column, TaskCard, BoardSkeleton |
| **Tasks** | 24 | TaskDetailModal, TaskForm, CommentSection, FileUpload, AssigneeSelector, PrioritySelector, SubtaskProgress |
| **Sprints** | 8 | SprintList, SprintForm, AISprintForm, AISprintButton |
| **Projects** | 6 | GitHubLinkDialog, ProjectGrid, TeamTabContent |
| **Admin** | 17 | VerticalList, ProjectList, MemberAssignment, UserRoleToggle |
| **Layout** | 3 | NavMenu, MobileMenu, UserProfileMenu |
| **Team** | 4 | TeamGrid, TeamCard, TeamMemberModal |
| **Profile** | 12 | ProfileForm, AvatarSelector, GitHubConnect |
| **Settings** | 2 | AppearanceSettings, NotificationSettings |
| **Auth** | 2 | LoginForm, RegisterForm |
| **Global** | 3 | CommandMenu, ThemeToggle, ErrorBoundary |

**Total: ~100+ components**

---

## 12. Routing & Pages

### Public Routes
| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password + GitHub OAuth sign-in |
| `/register` | Register | Create account with email/password |

### Protected Routes (require authentication)
| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Dashboard | All | Role-based: admin sees verticals, members see projects |
| `/team` | Team | All | Team member directory with stats |
| `/team-members/[id]` | Member Profile | All | Individual team member profile |
| `/profile` | My Profile | All | Current user's profile |
| `/settings` | Settings | All | Notifications, appearance, account |
| `/projects/[projectId]` | Project Detail | Members + Admin | Kanban board for active sprint |
| `/projects/[projectId]/sprints` | Sprint List | Members + Admin | All sprints for a project |
| `/admin/verticals` | Manage Verticals | Admin only | Create/edit verticals |
| `/admin/verticals/[id]` | Vertical Detail | Admin only | Members, projects, settings |
| `/admin/projects` | Manage Projects | Admin only | Create/edit projects, assign members |
| `/admin/users` | Manage Users | Admin only | View all users, change roles |
| `/debug` | Debug | Dev only | Development debugging page |

### API Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js handlers (login, callback, session) |
| `/api/github/webhook` | POST | GitHub webhook for issue close/reopen events |

### Loading States
Every major route has a `loading.tsx` with skeleton UI:
- Dashboard, Projects, Sprints, Team, Profile, Settings, Admin pages
- Users see skeleton cards/lists immediately while data loads

---

## 13. Styling & Theming

### Theme System
- **Provider:** `next-themes` library
- **Modes:** System (auto), Light, Dark
- **Persistence:** localStorage
- **Toggle:** Sun/Moon icon in header

### CSS Architecture
```
Tailwind CSS (utility classes)
  └── CSS Variables (theme tokens defined in globals.css)
      ├── :root { } — Light theme defaults
      └── .dark { } — Dark theme overrides
```

### Theme Tokens (CSS Variables)
| Token | Purpose |
|-------|---------|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--primary` | Brand color (buttons, links) |
| `--secondary` | Secondary elements |
| `--muted` | Subdued text/backgrounds |
| `--accent` | Highlights |
| `--destructive` | Error/delete actions |
| `--border` | Border colors |
| `--card` | Card backgrounds |
| `--popover` | Dropdown/popover backgrounds |

### Tailwind Configuration
- Dark mode: `class` strategy (toggled via `.dark` on `<html>`)
- Animation: `tailwindcss-animate` plugin
- Border radius: CSS variable-based (`--radius`)
- Colors: All mapped to CSS variables for theme switching

---

## 14. Performance Optimizations

### Applied Optimizations

| Optimization | Impact | Files |
|-------------|--------|-------|
| **Gzip compression** | 75% smaller responses | `next.config.ts` |
| **Image optimization** (AVIF/WebP) | Smaller images | `next.config.ts` |
| **Package import optimization** | Smaller bundle (lucide-react, dnd-kit tree-shaken) | `next.config.ts` |
| **5 database indexes** | Faster queries | `prisma/schema.prisma` |
| **Query caching** (30s TTL) | Reduce DB hits | `users.ts`, `verticals.ts`, `projects.ts`, `sprints.ts`, `team.ts` |
| **Specific cache invalidation** | No more global cache busting | All server actions |
| **Auth transaction** | 1 DB round-trip instead of 5-7 | `lib/auth/config.ts` |
| **Team query N+1 fix** | Single query instead of per-user queries | `server/actions/team.ts` |
| **Dynamic imports** | TaskDetailModal loaded on demand | `components/kanban/board.tsx` |
| **Link prefetching** | Pages pre-loaded on hover/scroll | `components/layout/nav-menu.tsx` |
| **Loading skeletons** | Instant feedback on navigation | All route `loading.tsx` files |
| **Optimistic UI** | Kanban drag feels instant | `components/kanban/board.tsx` |

### Performance Targets
| Metric | Target | Actual |
|--------|--------|--------|
| TTFB (warm) | < 100ms | ~85ms |
| TTFB (cold start) | < 2s | ~960ms |
| Kanban drag latency | < 300ms | Instant (optimistic) |
| Page loads | < 1s | < 1s |
| AI generation | < 5s | ~3-4s |
| Gzip compression | Active | 75% reduction |

---

## 15. Environment Variables

### Required
```bash
# Database (Neon Serverless Postgres)
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/nexus?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"     # or production URL

# GitHub OAuth App
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
GITHUB_TOKEN_ENCRYPTION_KEY="<openssl rand -base64 32>"

# AI
ANTHROPIC_API_KEY="sk-ant-xxxxx"
GOOGLE_AI_API_KEY="xxx-yyy-zzz"
```

### Optional
```bash
# GitHub system bot token (fallback for sync)
GITHUB_ACCESS_TOKEN="github_pat_xxxxx"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# File Storage (Cloudflare R2)
STORAGE_REGION="auto"
STORAGE_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY_ID="your-r2-access-key"
STORAGE_SECRET_ACCESS_KEY="your-r2-secret"
STORAGE_BUCKET_NAME="nexus-attachments"
```

---

## 16. Deployment

### Current Production Setup
| Component | Service | Details |
|-----------|---------|---------|
| **Hosting** | Vercel | Auto-deploys from GitHub `main` branch |
| **Domain** | GoDaddy | Custom domain pointing to Vercel |
| **Database** | Neon | Serverless PostgreSQL (free tier) |
| **Storage** | Cloudflare R2 | S3-compatible object storage |
| **GitHub** | github.com/satyavyshnavi-art/nexus | Source code repository |

### Deployment Pipeline
```
Code Change → Git Push → GitHub (main) → Vercel Auto-Deploy → Live
                                            ↓
                                    prisma generate
                                    prisma migrate deploy
                                    next build
                                            ↓
                                    Production URL updated
                                    GoDaddy domain serves new version
```

### Build Configuration
- **Build command:** `npm run build` (runs `next build`)
- **Install command:** `npm install` (runs postinstall: `prisma generate && prisma migrate deploy`)
- **Output:** Serverless functions + static assets
- **Build time:** ~50-55 seconds

### Vercel Settings
- **Framework:** Next.js (auto-detected)
- **Node.js version:** 24.x
- **Environment variables:** Set in Vercel project settings
- **Production branch:** `main`

---

## 17. Setup Guide

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- GitHub OAuth App
- Anthropic API key and/or Google AI API key

### Step-by-Step

#### 1. Clone & Install
```bash
git clone https://github.com/satyavyshnavi-art/nexus.git
cd nexus
npm install
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

#### 3. Set Up Database
```bash
npx prisma migrate deploy    # Apply migrations
npx prisma generate          # Generate Prisma client
```

#### 4. Create Admin User
```bash
npm run dev
# Visit http://localhost:3000/register
# Create account, then update role in DB:
npx prisma studio
# Set user.role = "admin"
```

#### 5. Configure GitHub OAuth (Optional)
1. Go to GitHub → Settings → Developer Settings → OAuth Apps
2. Create new app:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Client Secret to `.env`

#### 6. Configure File Storage (Optional)
1. Create a Cloudflare R2 bucket
2. Generate API tokens with read/write access
3. Add credentials to `.env`

#### 7. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

### First-Time Workflow
1. **Login** as admin
2. **Create a Vertical** (e.g., "Engineering")
3. **Create a Project** in the vertical
4. **Add team members** to the project
5. **Create a Sprint** with start/end dates
6. **Activate the Sprint**
7. **Create tasks** manually or use AI generation
8. **Drag tasks** on the Kanban board to update status

---

## 18. Business Rules

### Access Control Matrix

| Action | Admin | Member |
|--------|-------|--------|
| Create vertical | Yes | No |
| Create project | Yes | No |
| Add members to project | Yes | No |
| Create sprint | Yes | No |
| Activate sprint | Yes | No |
| Complete sprint | Yes | No |
| Create tasks | Yes | Yes (in assigned projects) |
| Move tasks (Kanban) | Yes | Yes (in assigned projects) |
| Add comments | Yes | Yes |
| Upload attachments | Yes | Yes |
| Use AI sprint generation | Yes | No |
| Change user roles | Yes | No |
| View all projects | Yes | No (only assigned) |
| View team directory | Yes | Yes |

### Key Business Rules
1. **One active sprint per project** — enforced via database transaction
2. **Sprint dates** — end date must be after start date
3. **Project membership** — members can only see projects they're assigned to
4. **Vertical assignment** — every user must belong to at least one vertical
5. **Bug auto-classification** — when task type = "bug", AI assigns priority
6. **GitHub sync** — requires user to have connected GitHub account with `repo` scope
7. **File uploads** — max 10MB per file, signed URLs expire after 1 hour
8. **Password requirements** — minimum 6 characters

---

## 19. Security

### Authentication Security
- **Passwords:** bcrypt hashed (cost factor 10)
- **Sessions:** JWT-based (stateless, no DB session table)
- **GitHub tokens:** AES-256-GCM encrypted at rest
- **CSRF:** Protected by NextAuth.js
- **Session expiry:** Managed by NextAuth JWT settings

### Authorization Security
- **Role-based:** Admin vs Member permissions checked on every server action
- **Project-scoped:** Members can only access their assigned projects
- **Server-side enforcement:** All auth checks happen in server actions, never client-only

### Data Security
- **Input validation:** Zod schemas on AI outputs, length limits on user input
- **SQL injection:** Prevented by Prisma ORM (parameterized queries)
- **XSS:** Prevented by React (automatic escaping)
- **Signed URLs:** File uploads/downloads use time-limited signed URLs
- **No API key exposure:** All AI/GitHub API calls happen server-side only
- **X-Powered-By removed:** `poweredByHeader: false` in next.config

### GitHub Token Security
```
User's GitHub Token
  → AES-256-GCM encryption (lib/crypto/encryption.ts)
  → Stored encrypted in database
  → Decrypted only when needed for API calls
  → Encryption key stored in environment variable
```

---

## 20. Testing

### Manual Testing Flow
1. Register a new user → verify account creation
2. Login with email/password → verify session
3. Login with GitHub OAuth → verify token storage + vertical assignment
4. Create vertical (admin) → verify it appears in list
5. Create project in vertical (admin) → verify it's linked to vertical
6. Add member to project (admin) → verify they can see it
7. Create sprint (admin) → verify dates and status
8. Activate sprint (admin) → verify only one active at a time
9. Create task → verify it appears on Kanban board
10. Create bug → verify AI auto-classifies priority
11. Drag task on Kanban → verify optimistic update + server confirmation
12. Add comment → verify it appears on task
13. Upload file → verify signed URL works
14. Sync task to GitHub → verify issue created
15. Close GitHub issue → verify webhook updates task status
16. Use AI sprint generation → verify tasks created in sprint

### Edge Cases
- Concurrent task drag-and-drop
- AI JSON validation failures (retry logic)
- GitHub API rate limiting
- File upload to expired signed URL
- Unauthorized access attempts
- One-active-sprint enforcement with concurrent requests

---

## Appendix: Admin Test Credentials

| Field | Value |
|-------|-------|
| Email | admin@nexus.com |
| Password | admin123 |

**Note:** These are test credentials only. Change immediately in production.

---

*Last updated: February 20, 2026*
*Built with Next.js 16, Prisma, Neon PostgreSQL, Google Gemini, and Claude AI*

# Nexus - AI-First Project Management Portal

## Complete Technical Documentation

> Written for someone who is completely new to tech. Every concept is explained from the ground up.

---

## Table of Contents

1. [What is Nexus?](#1-what-is-nexus)
2. [The Big Picture - How a Web App Works](#2-the-big-picture---how-a-web-app-works)
3. [Technology Stack - The Tools We Used](#3-technology-stack---the-tools-we-used)
4. [Project Architecture - How the Code is Organized](#4-project-architecture---how-the-code-is-organized)
5. [Database Design - How Data is Stored](#5-database-design---how-data-is-stored)
6. [Authentication - How Users Log In](#6-authentication---how-users-log-in)
7. [Core Features - Step by Step](#7-core-features---step-by-step)
8. [AI Integration - The Smart Part](#8-ai-integration---the-smart-part)
9. [File Storage - Handling Uploads](#9-file-storage---handling-uploads)
10. [GitHub Integration - Connecting to Code](#10-github-integration---connecting-to-code)
11. [UI/UX Design Approach](#11-uiux-design-approach)
12. [Deployment - Making it Live](#12-deployment---making-it-live)
13. [Feature-by-Feature Breakdown](#13-feature-by-feature-breakdown)
14. [Feasibility Analysis](#14-feasibility-analysis)
15. [Glossary of Terms](#15-glossary-of-terms)

---

## 1. What is Nexus?

Nexus is a **project management tool** - think of it like a digital whiteboard where teams organize their work. But unlike basic tools, Nexus uses **Artificial Intelligence** to help plan work automatically.

### What problems does it solve?

Imagine you're building a mobile app with a team of 5 people. You need to:
- Break down "build a login page" into smaller tasks like "design the form", "write the backend logic", "test it"
- Assign the right tasks to the right people (a designer shouldn't get a database task)
- Track what's in progress, what's done, and what's stuck
- Upload wireframe images and screenshots for reference

**Nexus does all of this, and the AI part means you can type "build a user authentication system" and it automatically creates 15-20 organized tasks with priorities, roles, and assignments.**

### Who is it for?

- Software development teams (2-50 people)
- Project managers who plan sprints (work cycles, usually 2 weeks)
- Developers who need to see their assigned tasks on a visual board

---

## 2. The Big Picture - How a Web App Works

Before diving into Nexus, let's understand how any website works:

### The Restaurant Analogy

Think of a web application like a restaurant:

| Restaurant | Web App | Nexus Equivalent |
|-----------|---------|-------------------|
| **Menu** (what you see) | **Frontend** - the visual interface | React components, Tailwind CSS |
| **Kitchen** (where food is made) | **Backend** - the logic and processing | Next.js Server Actions |
| **Pantry** (where ingredients are stored) | **Database** - where data lives | PostgreSQL via Prisma |
| **Waiter** (carries orders back and forth) | **API** - communication layer | Server Actions, API Routes |
| **Recipe book** | **Business Logic** - rules and processes | Server action files |
| **Chef's special sauce** | **AI Integration** - smart features | Google Gemini AI |

### How a Page Load Works (simplified)

```
1. You type pm.stanzasoft.ai in your browser
2. Browser sends a request to Vercel's servers
3. Next.js runs the page code on the server
4. Server checks if you're logged in (authentication)
5. If yes, it fetches your data from the database
6. It builds the HTML page with your data
7. Sends the complete page to your browser
8. Your browser displays the page
9. JavaScript loads to make buttons and interactions work
```

---

## 3. Technology Stack - The Tools We Used

Every tool was chosen for a specific reason. Here's what we used and **why**:

### 3.1 Frontend (What Users See)

#### Next.js 16 - The Framework
**What it is:** A framework built on top of React that adds routing, server-side rendering, and more.

**Why we chose it:**
- **Server-side rendering** - Pages load fast because the server builds the HTML before sending it to the browser. A user in India seeing a dashboard doesn't wait for JavaScript to load and then fetch data. The server does it all first.
- **App Router** - A file-based routing system. If you create a file at `app/settings/page.tsx`, the page automatically appears at `/settings`. No manual configuration.
- **Server Actions** - Instead of building a separate backend API, we write server functions directly in our codebase and call them like regular functions. This saves hundreds of lines of code.

**Feasibility:** Next.js is used by Netflix, TikTok, Uber, and thousands of startups. It's extremely well-documented and has a huge community. Very feasible for projects of any size.

#### React 19 - The UI Library
**What it is:** A JavaScript library for building user interfaces using reusable "components" (building blocks).

**Why we chose it:**
- **Component model** - Build once, reuse everywhere. Our `<Button>` component is used 100+ times across the app.
- **Reactive updates** - When data changes, only the affected part of the page updates. Moving a task on the Kanban board doesn't reload the whole page.
- **Massive ecosystem** - Thousands of ready-made libraries for drag-and-drop, forms, animations, etc.

**Analogy:** React is like LEGO blocks. Each block (component) has a specific shape and purpose. You combine small blocks into bigger ones. A `<TaskCard>` is made of a `<Badge>`, a `<Button>`, and some text. A `<KanbanColumn>` is made of multiple `<TaskCard>` blocks.

#### TypeScript - The Language
**What it is:** JavaScript with types. Instead of just writing `let name = "Nexus"`, you write `let name: string = "Nexus"`.

**Why we chose it:**
- **Catches errors before they happen** - If a function expects a number and you pass text, TypeScript tells you immediately instead of crashing in production.
- **Better autocomplete** - Your code editor knows exactly what properties an object has.
- **Self-documenting** - Types act as documentation. `userId: string` tells you exactly what that variable holds.

**Feasibility:** TypeScript is now the industry standard. Over 80% of professional JavaScript projects use it.

#### Tailwind CSS - The Styling
**What it is:** A CSS framework where you style elements using class names directly in HTML instead of writing separate CSS files.

**Traditional CSS approach:**
```css
/* styles.css */
.button {
  background-color: blue;
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
}
```

**Tailwind approach:**
```html
<button class="bg-blue-500 px-4 py-2 rounded-lg text-white">
```

**Why we chose it:**
- **Speed** - No switching between files. Style as you build.
- **Consistency** - Predefined spacing scale (4px, 8px, 12px, 16px...) prevents random sizes.
- **Small bundle** - Only the classes you use are included in the final CSS file.
- **Dark mode** - Adding `dark:bg-gray-900` instantly supports dark theme.

#### shadcn/ui - Pre-built Components
**What it is:** A collection of beautifully designed, accessible UI components (buttons, dialogs, tabs, dropdowns) that you copy into your project and customize.

**Why we chose it:**
- **Not a dependency** - The code lives in your project, so you can modify anything.
- **Accessible** - Built on Radix UI primitives which handle keyboard navigation, screen readers, and focus management.
- **Consistent design** - All components follow the same design language.

**Components we use:** Button, Dialog, Tabs, DropdownMenu, Sheet (mobile drawer), Card, Input, Textarea, Select, Switch, AlertDialog, Badge, Avatar, Command (search palette), Skeleton (loading states).

#### Lucide React - Icons
**What it is:** A library of 1000+ clean, consistent SVG icons.

**Why:** Every icon in Nexus (home, settings, users, search, sparkles for AI) comes from Lucide. Using one icon library ensures visual consistency across the entire app.

### 3.2 Backend (The Server Logic)

#### Next.js Server Actions
**What it is:** Functions that run on the server but can be called from the browser like regular functions. They're marked with `"use server"` at the top of the file.

**Example of how it works:**
```typescript
// server/actions/tasks.ts (runs on server)
"use server";

export async function createTask(data) {
  // 1. Check if user is logged in
  // 2. Validate the data
  // 3. Save to database
  // 4. Return the result
}

// components/kanban/board.tsx (runs in browser)
import { createTask } from "@/server/actions/tasks";

// When user clicks "Create Task":
const task = await createTask({ title: "Design login page", ... });
```

**Why we chose this over a traditional API:**
- **No boilerplate** - No need to set up Express routes, handle HTTP methods, parse request bodies.
- **Type safety** - TypeScript types flow from server to client automatically.
- **Less code** - A traditional REST API would need 2-3x more files.

#### Prisma - Database ORM
**What it is:** An Object-Relational Mapper. Instead of writing raw SQL queries, you write JavaScript-like code.

**Without Prisma (raw SQL):**
```sql
SELECT * FROM tasks WHERE sprint_id = '123' AND status = 'todo' ORDER BY created_at DESC;
```

**With Prisma:**
```typescript
const tasks = await db.task.findMany({
  where: { sprintId: "123", status: "todo" },
  orderBy: { createdAt: "desc" },
});
```

**Why we chose it:**
- **Type safety** - Prisma generates TypeScript types from your database schema. If a `Task` has a `title` field, TypeScript knows it's a string.
- **Migrations** - When you change the schema, Prisma generates SQL to update the database safely.
- **Relations** - Fetching a task with its comments and assignee is one line of code.
- **Query optimization** - Prisma generates efficient SQL under the hood.

**Feasibility:** Prisma is the most popular TypeScript ORM with 35,000+ GitHub stars. Used by companies like Netflix, Mercedes-Benz, and thousands of startups.

#### PostgreSQL (via Neon) - The Database
**What it is:** A powerful relational database that stores all application data in structured tables.

**Why PostgreSQL:**
- **Reliability** - 30+ years of development. Used by Instagram, Spotify, Reddit.
- **ACID compliance** - Guarantees that transactions (like creating a sprint with 20 tasks) either fully complete or fully roll back. No half-created data.
- **JSON support** - Can store flexible data like task labels as arrays.
- **Scalability** - Handles millions of rows efficiently with proper indexing.

**Why Neon specifically:**
- **Serverless** - Scales to zero when not in use (saves cost), scales up automatically under load.
- **Branching** - Can create database branches for testing (like Git branches for code).
- **Free tier** - Generous free tier for development and small production apps.

### 3.3 Authentication (Login System)

#### NextAuth.js v5 - Authentication Library
**What it is:** A library that handles user login, session management, and OAuth (social login) for Next.js apps.

**Why we chose it:**
- **Multiple providers** - Supports email/password, GitHub, Google, and 50+ other providers out of the box.
- **JWT sessions** - Stateless sessions stored as encrypted tokens. No need for a session database table.
- **Middleware** - Automatically redirects unauthenticated users to the login page.
- **Security** - Handles CSRF protection, token rotation, and secure cookie management.

**Our providers:**
1. **Credentials** - Email + password (hashed with bcrypt)
2. **GitHub OAuth** - "Sign in with GitHub" button
3. **Google OAuth** - "Sign in with Google" button

### 3.4 AI Integration

#### Google Gemini 2.5 Flash - AI Model
**What it is:** Google's multimodal AI model that can understand text AND images, and return structured JSON responses.

**Why Gemini over alternatives:**
- **Structured output** - Native JSON response mode (`responseMimeType: "application/json"`) means we get clean data, not messy text.
- **Multimodal** - Users can attach wireframe images and Gemini analyzes them alongside the text description.
- **Speed** - The "Flash" variant is optimized for fast responses (5-15 seconds for sprint generation).
- **Cost** - More affordable than GPT-4 for structured generation tasks.
- **Generous limits** - Supports up to 20MB of inline image data.

**How we use it:**
1. **Sprint Planning** - "Build an authentication system" -> 10+ organized user stories with tasks
2. **Ticket Generation** - Describe a feature -> Get structured tickets with roles and priorities
3. **Bug Classification** - Describe a bug -> Get automatic priority assignment (low/medium/high/critical)

### 3.5 File Storage

#### Cloudflare R2 - Object Storage
**What it is:** Cloud storage for files (images, documents, etc.) that's compatible with Amazon S3's API.

**Why R2 over AWS S3:**
- **No egress fees** - Downloading files is free. AWS S3 charges for every download.
- **S3 compatible** - We use the same AWS SDK, so switching providers is easy.
- **Global CDN** - Files are served from Cloudflare's global network (fast worldwide).
- **Cost effective** - Significantly cheaper than AWS S3 for most usage patterns.

### 3.6 Deployment

#### Vercel - Hosting Platform
**What it is:** A cloud platform optimized for Next.js applications.

**Why Vercel:**
- **Zero configuration** - Push code to GitHub, Vercel automatically builds and deploys.
- **Edge network** - Your app runs on servers closest to your users globally.
- **Preview deployments** - Every Git branch gets its own URL for testing.
- **Serverless functions** - Server Actions run as serverless functions that scale automatically.
- **Custom domains** - Easy to connect `pm.stanzasoft.ai` to the app.

### 3.7 Additional Tools

| Tool | Purpose | Why |
|------|---------|-----|
| **dnd-kit** | Drag and drop for Kanban | Most flexible React DnD library, works on mobile |
| **Zustand** | State management (Kanban only) | Lightweight (1KB), simpler than Redux |
| **Zod** | Data validation | Validates AI responses and form inputs with TypeScript types |
| **bcrypt** | Password hashing | Industry standard for secure password storage |
| **date-fns** | Date formatting | Lightweight date utility library |
| **canvas-confetti** | Confetti animation | Fun celebration when tasks are completed |
| **next-themes** | Dark/light mode | Handles theme switching with system preference detection |
| **cmdk** | Command palette | Powers the Cmd+K search interface |
| **Octokit** | GitHub API client | Official GitHub SDK for repository and issue management |

---

## 4. Project Architecture - How the Code is Organized

### 4.1 Folder Structure

```
nexus/
|-- app/                    # PAGES - What URL shows what page
|   |-- (auth)/             # Public pages (login, register)
|   |   |-- login/          #   /login
|   |   |-- register/       #   /register
|   |-- (dashboard)/        # Protected pages (require login)
|   |   |-- layout.tsx      #   Shared layout with sidebar
|   |   |-- page.tsx        #   / (Dashboard homepage)
|   |   |-- team/           #   /team
|   |   |-- my-tasks/       #   /my-tasks
|   |   |-- profile/        #   /profile
|   |   |-- settings/       #   /settings
|   |   |-- projects/       #   /projects/[id], /projects/[id]/sprints
|   |   |-- team-members/   #   /team-members/[id]
|   |   |-- admin/          #   /admin/verticals, /admin/projects, /admin/users
|   |-- api/                # API routes (minimal)
|       |-- auth/           #   NextAuth.js handlers
|       |-- attachments/    #   File upload endpoints
|       |-- github/         #   GitHub webhooks
|
|-- components/             # REUSABLE UI PIECES
|   |-- ui/                 #   Base components (Button, Dialog, Card, etc.)
|   |-- kanban/             #   Kanban board, columns, task cards
|   |-- sprints/            #   Sprint management, AI planning
|   |-- tasks/              #   Task creation, detail, comments
|   |-- admin/              #   Admin panels (verticals, projects, users)
|   |-- layout/             #   Sidebar, user menu
|   |-- dashboard/          #   Dashboard widgets
|   |-- profile/            #   Profile page components
|   |-- team/               #   Team page components
|   |-- providers/          #   Theme and session providers
|
|-- server/                 # BACKEND LOGIC
|   |-- actions/            #   Server actions (the "kitchen")
|   |   |-- tasks.ts        #     Create, update, delete tasks
|   |   |-- sprints.ts      #     Sprint management
|   |   |-- projects.ts     #     Project CRUD
|   |   |-- comments.ts     #     Task comments
|   |   |-- ai-sprint.ts    #     AI-powered sprint planning
|   |   |-- team.ts         #     Team/user management
|   |   |-- settings.ts     #     User settings
|   |   |-- search.ts       #     Global search
|   |   |-- attachments.ts  #     File handling
|   |   |-- github-sync.ts  #     GitHub sync logic
|   |-- db.ts               #   Database client setup
|
|-- lib/                    # UTILITIES AND HELPERS
|   |-- ai/                 #   AI integration
|   |   |-- gemini.ts       #     Gemini API wrapper
|   |   |-- sprint-generator.ts  # Task generation logic
|   |   |-- sprint-planner.ts    # Sprint planning logic
|   |   |-- bug-classifier.ts    # Bug priority AI
|   |-- auth/               #   Authentication config
|   |-- storage/            #   R2/S3 file storage
|   |-- github/             #   GitHub API client
|   |-- hooks/              #   Custom React hooks
|   |-- stores/             #   Zustand state stores
|   |-- utils/              #   Shared utilities
|
|-- prisma/
|   |-- schema.prisma       # DATABASE SCHEMA - single source of truth
|
|-- public/                 # STATIC FILES (logos, images)
```

### 4.2 The Three Layers

Nexus follows a strict **three-layer architecture**:

```
+---------------------------------------------+
|              LAYER 1: UI (components/)       |
|                                             |
|  What users see and interact with.          |
|  NEVER talks to the database directly.      |
|  Only calls server actions.                 |
|                                             |
|  Example: A "Create Task" button calls      |
|  createTask() from server/actions/tasks.ts  |
+---------------------------------------------+
|         LAYER 2: LOGIC (server/actions/)     |
|                                             |
|  Where business rules live.                 |
|  Checks permissions, validates data,        |
|  talks to the database, calls AI.           |
|                                             |
|  Example: createTask() checks auth,         |
|  validates input, saves to DB, revalidates  |
+---------------------------------------------+
|         LAYER 3: DATA (prisma + lib/)        |
|                                             |
|  Database access and external services.     |
|  Prisma handles all database queries.       |
|  lib/ai/ handles AI calls.                  |
|  lib/storage/ handles file uploads.         |
+---------------------------------------------+
```

**Why this matters:** If we want to change how the database works, we only change Layer 3. The UI doesn't need to know or care. This is called **separation of concerns** and it makes the codebase maintainable as it grows.

### 4.3 File Count Summary

| Category | Files | Purpose |
|----------|-------|---------|
| Pages (app/) | ~34 | URL routes and page components |
| UI Components | ~118 | Reusable interface pieces |
| Server Actions | 14 | Backend business logic |
| Utilities (lib/) | ~20 | Helpers, AI, auth, storage |
| Schema | 1 | Database structure definition |
| **Total** | **~220** | |

---

## 5. Database Design - How Data is Stored

### 5.1 What is a Database Schema?

A schema is like a blueprint for a building. It defines:
- What "rooms" (tables) exist
- What "furniture" (columns) each room has
- How rooms connect to each other (relationships)

### 5.2 Our Data Model

Think of the data as a hierarchy:

```
Users
  +-- belong to -> Verticals (workspaces/departments)
       +-- contain -> Projects
            +-- have -> Sprints (2-week work cycles)
                 +-- contain -> Tasks
                      |-- have -> Comments
                      |-- have -> Attachments (files)
                      +-- have -> Child Tasks (subtasks)
```

### 5.3 Each Table Explained

#### Users Table
```
What it stores: Everyone who has an account
Key fields:
  - id          -> Unique identifier (like a social security number, but random)
  - email       -> Login email (must be unique)
  - passwordHash-> Encrypted password (we NEVER store plain passwords)
  - name        -> Display name
  - role        -> "admin" or "member" (controls what they can do)
  - designation -> Job title ("Frontend Developer", "QA Engineer")
  - avatar      -> Profile picture URL
  - bio         -> Short description about themselves
  - GitHub fields -> For GitHub integration (access tokens, username)
```

**Security note:** Passwords are "hashed" using bcrypt. Hashing is a one-way mathematical function. Even if someone steals the database, they can't reverse the hash to get the original password.

#### Verticals Table (Workspaces)
```
What it stores: Departments or business units
Key fields:
  - id   -> Unique identifier
  - name -> "Engineering", "Marketing", "Design" (must be unique)

Think of verticals as folders that group related projects together.
```

#### Projects Table
```
What it stores: Each project being managed
Key fields:
  - id          -> Unique identifier
  - name        -> "Mobile App Redesign"
  - description -> Details about the project
  - verticalId  -> Which vertical this project belongs to
  - createdBy   -> Who created it (must be an admin)
  - GitHub fields -> If linked to a GitHub repository
```

#### Sprints Table
```
What it stores: Time-boxed work periods (usually 1-4 weeks)
Key fields:
  - id        -> Unique identifier
  - name      -> "Sprint 1: Authentication"
  - startDate -> When it starts
  - endDate   -> When it ends
  - status    -> "planned", "active", or "completed"
  - projectId -> Which project this sprint belongs to

Business rule: Only ONE sprint can be "active" per project at a time.
```

#### Tasks Table
```
What it stores: Individual work items
Key fields:
  - id           -> Unique identifier
  - title        -> "Create login form component"
  - description  -> Detailed requirements
  - type         -> "story" (big), "task" (medium), or "bug" (fix)
  - status       -> "todo", "progress", "review", or "done"
  - priority     -> "low", "medium", "high", or "critical"
  - storyPoints  -> Effort estimate (1-20, where 1 is trivial)
  - assigneeId   -> Who is working on this
  - parentTaskId -> If this is a subtask, which story it belongs to
  - requiredRole -> "UI", "Backend", "QA", etc. (set by AI)
  - labels       -> Tags like ["authentication", "api", "database"]
  - sprintId     -> Which sprint this task is in
  - GitHub fields-> If synced to a GitHub issue
```

#### TaskComment Table
```
What it stores: Discussions on tasks
Key fields:
  - id      -> Unique identifier
  - taskId  -> Which task this comment is on
  - userId  -> Who wrote it
  - content -> The comment text
```

#### TaskAttachment Table
```
What it stores: Files uploaded to tasks
Key fields:
  - id         -> Unique identifier
  - taskId     -> Which task this file is attached to
  - fileName   -> "wireframe-v2.png"
  - mimeType   -> "image/png" (file type)
  - sizeBytes  -> File size in bytes
  - s3Key      -> Where it's stored in Cloudflare R2
```

### 5.4 Relationships Visualized

```
User --+-- creates ----> Projects
       |-- belongs to -> Verticals (via VerticalUser join table)
       |-- member of --> Projects (via ProjectMember join table)
       |-- assigned to > Tasks
       |-- creates ----> Tasks
       |-- writes -----> Comments
       +-- uploads ----> Attachments

Project -- contains -> Sprints -- contains -> Tasks
                                              |-- has -> Comments
                                              |-- has -> Attachments
                                              +-- has -> Child Tasks
```

### 5.5 Indexes (Making Searches Fast)

When you have 10,000 tasks, finding "all tasks assigned to user X in sprint Y" could be slow without indexes. An index is like a book's table of contents - instead of reading every page, you jump directly to the right section.

Our key indexes:
- `[sprintId, status]` - Fast Kanban board loading
- `[assigneeId]` - Fast "My Tasks" page
- `[sprintId, requiredRole]` - Fast role-based views
- `[userId, createdAt]` - Fast user activity queries

---

## 6. Authentication - How Users Log In

### 6.1 Three Ways to Log In

#### Method 1: Email + Password
```
1. User types email and password
2. We look up the email in the database
3. We hash the typed password with bcrypt
4. We compare it to the stored hash
5. If they match -> user is logged in
6. If not -> "Invalid credentials" error
```

**Why hashing?** If we stored passwords as plain text ("password123"), anyone who accessed the database would know everyone's password. Hashing converts "password123" to something like `$2b$10$N9qo8u...` which is impossible to reverse.

#### Method 2: GitHub OAuth
```
1. User clicks "Sign in with GitHub"
2. Browser redirects to GitHub's login page
3. User enters GitHub credentials on GitHub's site (we never see them)
4. GitHub asks "Allow Nexus to access your account?"
5. User clicks "Allow"
6. GitHub redirects back to Nexus with a temporary code
7. Nexus exchanges the code for an access token
8. Nexus uses the token to fetch user profile from GitHub
9. If user exists in our DB -> log them in
10. If not -> create a new account automatically
```

**Why OAuth?** Users don't need to create yet another password. And we get access to their GitHub repositories for the integration feature.

#### Method 3: Google OAuth
```
Same flow as GitHub but with Google:
1. Click "Sign in with Google"
2. Redirect to Google login
3. Google sends back user profile
4. We find or create the user
```

### 6.2 Session Management (Staying Logged In)

After logging in, we create a **JWT (JSON Web Token)** - a small encrypted piece of data stored in the browser's cookies.

```
JWT contains:
  - userId: "abc-123"
  - role: "admin"
  - designation: "Full-Stack Developer"
  - expiry: "2026-03-01T00:00:00Z"
```

Every time the user makes a request, the browser automatically sends this cookie. The server decrypts it, sees "this is user abc-123 with admin role", and allows or denies the action.

**Why JWT over sessions?** Traditional sessions store data on the server, requiring a database lookup on every request. JWTs are self-contained - the server can verify them without any database call, making pages load faster.

### 6.3 Authorization (Who Can Do What)

```
Admin can:
  - Create projects and sprints
  - Use AI generation features
  - Manage team members
  - Delete users
  - Access admin panel

Member can:
  - View assigned projects
  - Create and move tasks
  - Add comments and attachments
  - Update their profile
  - Cannot create projects or sprints
  - Cannot access admin panel
```

---

## 7. Core Features - Step by Step

### 7.1 Dashboard

**What it shows:** An overview of the user's work.

**For Admins:** Summary of all verticals, projects, and team stats.
**For Members:** Their assigned tasks, recent projects, and activity.

**How it works:**
1. Page loads -> Server checks user role
2. Admin -> Fetches aggregated stats across all projects
3. Member -> Fetches only projects they're a member of
4. Data is cached for 30 seconds to reduce database load

### 7.2 Kanban Board (The Heart of Nexus)

**What it is:** A visual board with columns representing task stages.

```
+----------+  +----------+  +----------+  +----------+
|   TODO   |  | PROGRESS |  |  REVIEW  |  |   DONE   |
|          |  |          |  |          |  |          |
| +------+ |  | +------+ |  | +------+ |  | +------+ |
| |Task 1| |  | |Task 3| |  | |Task 5| |  | |Task 7| |
| +------+ |  | +------+ |  | +------+ |  | +------+ |
| +------+ |  | +------+ |  |          |  | +------+ |
| |Task 2| |  | |Task 4| |  |          |  | |Task 8| |
| +------+ |  | +------+ |  |          |  | +------+ |
+----------+  +----------+  +----------+  +----------+
```

**How drag-and-drop works:**
1. User presses and holds a task card
2. dnd-kit detects the drag gesture (mouse or touch)
3. A semi-transparent "overlay" copy follows the cursor
4. As the cursor moves over a column, the column highlights
5. User drops the task in the new column
6. **Optimistic update:** The UI moves the card immediately (feels instant)
7. In the background, a server action updates the database
8. If the server update fails, the card moves back to its original position
9. If the task moves to "Done" -> confetti animation plays!

**Why optimistic updates matter:** Without them, the user would drag a card, wait 200-500ms for the server, then see it move. With optimistic updates, it feels instantaneous.

**Two view modes:**
- **Status View** - Traditional Kanban (TODO -> PROGRESS -> REVIEW -> DONE)
- **Role View** - Tasks grouped by required role (UI, Backend, QA, etc.)

**Role filter pills:** Click "Backend" to only see backend tasks. Click again to deselect.

### 7.3 Task Management

Each task card shows:
- **Type icon** - Story (book), Task (checkbox), Bug (bug icon)
- **Priority badge** - Color-coded (blue=low, yellow=medium, orange=high, red=critical)
- **Role badge** - Color-coded by assigned role
- **Title** - The task name
- **Labels** - Tags like "authentication", "api"
- **Footer** - Comment count, attachment count, story points
- **Assignee** - Avatar with initials

**Click a task** to open the detail modal showing:
- Full description
- Comments thread (add, delete)
- File attachments (upload, download, delete)
- Edit all fields (title, description, priority, assignee, etc.)
- Subtask list (for stories)
- Progress bar (based on subtask completion)

### 7.4 Sprint Management

A sprint is a time-boxed work period. Here's the full lifecycle:

```
1. PLAN     -> Admin creates a sprint (manually or with AI)
2. REVIEW   -> Team reviews and adjusts tasks
3. ACTIVATE -> Admin activates the sprint (starts the clock)
4. WORK     -> Team moves tasks through the Kanban board
5. COMPLETE -> Admin completes the sprint
               -> Option to move incomplete tasks to next sprint
```

**One active sprint rule:** Only one sprint can be active per project at any time. This prevents confusion about which sprint the team is currently working on.

### 7.5 Team Management

**Team page:** Shows all team members with their designations, roles, and project assignments.

**Admin capabilities:**
- Add members to projects
- Remove members from projects
- Toggle admin/member roles
- Delete users (with full cascade cleanup - reassigns tasks, deletes orphaned data)

### 7.6 Command Menu (Cmd+K)

Press `Cmd+K` (or `Ctrl+K` on Windows) to open a search palette:

```
+-------------------------------------+
| Search commands, projects...         |
+-------------------------------------+
| Quick Actions                       |
|   Dashboard                         |
|   My Tasks                          |
|   Team                              |
|   Settings                          |
|                                     |
| Search Results                      |
|   Project: Mobile App               |
|   Task: Fix login bug               |
|   User: John Smith                  |
+-------------------------------------+
```

**How it works:** As you type, a server action searches across projects, tasks, and team members in real-time. Results are grouped by type and clicking navigates to the item.

### 7.7 User Profile

**What users can edit:**
- Name, designation, bio
- Avatar (uploaded to Cloudflare R2)
- Password (for email/password accounts)

**Stats shown:** Total tasks assigned, tasks completed, projects count.

---

## 8. AI Integration - The Smart Part

This is what makes Nexus special. Here's how it works under the hood:

### 8.1 The AI Wrapper (`lib/ai/gemini.ts`)

We built a reusable wrapper around Google's Gemini API:

```
+------------------------------------------------------+
|                generateStructuredOutput()              |
|                                                        |
|  Input:                                               |
|    - System prompt (instructions for the AI)          |
|    - User prompt (what the user typed)                |
|    - Zod schema (expected output structure)           |
|    - Images (optional wireframes/screenshots)         |
|                                                        |
|  Process:                                             |
|    1. Combine prompts                                 |
|    2. If images provided, build multipart request     |
|    3. Send to Gemini 2.5 Flash                        |
|    4. Parse JSON response                             |
|    5. Validate against Zod schema                     |
|    6. If validation fails, retry with stricter prompt |
|    7. Return typed result                             |
|                                                        |
|  Output: Typed, validated data matching the schema    |
+------------------------------------------------------+
```

**Why Zod validation?** AI models sometimes produce unexpected formats. Zod catches errors like:
- Missing required fields
- Numbers outside allowed ranges
- Invalid priority values
- Titles exceeding character limits

### 8.2 AI Sprint Planning (Two-Step Flow)

This is the most sophisticated feature. Here's the complete flow:

#### Step 1: Generate

```
User types: "Build a user authentication system with email/password,
             OAuth, password reset, and role-based access control"

User optionally attaches: wireframe screenshots, design mockups
```

What happens on the server (`aiGenerateSprintPlan()`):

1. Fetch project team members and their designations
2. Build AI prompt with:
   - System instructions (JSON format, role classification rules)
   - Team member info (so AI can consider their skills)
   - User's feature description
   - Reference images (if any)
3. Call Gemini API
4. Validate response against SprintPlanSchema
5. For each task, run role matching:
   - Look at task's required_role ("Backend")
   - Look at team members' designations
   - Match keywords: "backend developer" -> high confidence for Backend tasks
   - Score: high (2+ keyword matches), medium (1 match), low (no match)
6. Return enriched plan with assignee suggestions

**What the AI returns:**
```json
{
  "sprint_name": "Authentication Sprint",
  "duration_days": 14,
  "role_distribution": [
    { "role": "Backend", "story_points": 13, "task_count": 5 },
    { "role": "UI", "story_points": 8, "task_count": 4 },
    { "role": "QA", "story_points": 5, "task_count": 3 }
  ],
  "stories": [
    {
      "title": "Email/Password Authentication",
      "story_points": 8,
      "required_role": "Full-Stack",
      "priority": "high",
      "labels": ["authentication", "security"],
      "tasks": [
        {
          "title": "Create login form component",
          "required_role": "UI",
          "labels": ["ui", "forms"],
          "priority": "high"
        },
        {
          "title": "Implement bcrypt password hashing",
          "required_role": "Backend",
          "labels": ["security", "api"],
          "priority": "critical"
        }
      ]
    }
  ]
}
```

#### Step 2: Review and Edit

The user sees a fully editable review screen:
- Edit sprint name and duration
- Add/remove stories
- Edit story titles, points, roles, priorities
- Add/remove tasks within stories
- Change task roles, priorities
- Select assignees from AI-suggested list (with confidence indicators)
- View role distribution chart

#### Step 3: Confirm

Once satisfied, the user clicks "Confirm & Create Sprint":
1. A database transaction creates:
   - The sprint record
   - All story records (as parent tasks)
   - All child task records (linked to their parent stories)
2. Assignees are set based on user selections
3. Page cache is refreshed
4. User sees the new sprint in the sprint list

### 8.3 AI Ticket Generation

Similar to sprint planning but for adding tasks to an existing sprint:

```
1. Navigate to a sprint
2. Click "AI Generate Tickets"
3. Describe the feature + optionally attach images
4. AI generates stories and tasks
5. Review and edit
6. Confirm -> tasks added to the existing sprint
```

### 8.4 Image Support for AI

Users can attach up to 3 images (5MB each) when generating:

**Supported formats:** JPEG, PNG, WebP, GIF

**How it works technically:**
1. User selects image files via file picker
2. JavaScript reads each file using `FileReader.readAsDataURL()`
3. Extracts the base64 data (the image encoded as text)
4. Sends base64 data to server action
5. Server passes images to Gemini as `inlineData` parts
6. Gemini analyzes images alongside the text description
7. AI considers visual elements when generating tasks

**Example use case:** User uploads a wireframe of a dashboard -> AI generates specific UI tasks like "Create sidebar navigation component", "Build chart widget for analytics", etc.

### 8.5 Bug Classification

When a task is created with type "bug":
1. The description is sent to Gemini
2. AI analyzes the bug description
3. Returns a priority: low, medium, high, or critical
4. Priority is automatically set on the task

**Rules the AI follows:**
- Crash/data loss -> critical
- Payment/security issues -> critical/high
- Performance degradation -> high/medium
- UI/cosmetic issues -> low
- Feature requests mislabeled as bugs -> medium

---

## 9. File Storage - Handling Uploads

### How File Uploads Work

```
1. User clicks "Attach File" on a task
2. Browser opens file picker
3. User selects a file (image, document, etc.)
4. Frontend generates a "presigned URL" from our API
   (A presigned URL is a temporary link that allows direct upload to R2)
5. Browser uploads file directly to Cloudflare R2
   (File never passes through our server -> faster uploads)
6. Frontend saves the file metadata to our database
7. File appears in the task's attachment list

To download:
1. User clicks on an attachment
2. Server generates a presigned download URL
3. Browser downloads directly from R2
```

**Why presigned URLs?** Without them, the file would upload from browser -> our server -> R2 (slow, uses our server's bandwidth). With presigned URLs, the file goes directly from browser -> R2, and our server just manages the permissions.

---

## 10. GitHub Integration - Connecting to Code

### What It Does

Teams can link a Nexus project to a GitHub repository. This enables:
- Creating GitHub issues from Nexus tasks
- Syncing task status changes to GitHub
- Receiving GitHub webhook events for bidirectional sync

### How It Works

```
Nexus Task -> Create -> GitHub Issue
  "Fix login bug"  ->  GitHub Issue #42

Nexus: Move to "Done" -> GitHub: Issue #42 closed
GitHub: Reopen #42    -> Nexus: Move back to "Review"
```

**OAuth Token Management:**
- When users connect GitHub, their access token is encrypted using AES encryption
- Tokens are stored encrypted in the database
- When making GitHub API calls, tokens are decrypted in memory only
- Refresh tokens handle token expiration automatically

---

## 11. UI/UX Design Approach

### Design Principles

1. **Consistency** - Every button, card, and badge follows the same design system
2. **Responsiveness** - Works on desktop (1920px) down to mobile (375px)
3. **Dark mode** - Full dark mode support throughout
4. **Accessibility** - Keyboard navigation, screen reader support via Radix UI
5. **Optimistic UI** - Actions feel instant (update UI first, sync to server in background)

### Layout Architecture

**Desktop:**
```
+------+----------------------------------+
|      |                                  |
|  S   |         Main Content             |
|  I   |                                  |
|  D   |   +--------------------------+   |
|  E   |   |  Page Content            |   |
|  B   |   |  (max-width: 1280px)     |   |
|  A   |   |  (centered)              |   |
|  R   |   +--------------------------+   |
|      |                                  |
| 260px|            Flexible              |
+------+----------------------------------+
```

**Mobile:**
```
+--------------------------+
| Menu  Logo      Search   |  <- Sticky header
+--------------------------+
|                          |
|     Main Content         |
|                          |
|                          |
+--------------------------+

Tap Menu -> Sheet slides in from left with navigation
```

### Color System

**Role Colors (consistent across the app):**

| Role | Color |
|------|-------|
| UI | Blue |
| Backend | Green |
| QA | Purple |
| DevOps | Orange |
| Full-Stack | Indigo |
| Design | Pink |
| Data | Teal |
| Mobile | Red |

**Priority Colors:**

| Priority | Color |
|----------|-------|
| Low | Blue |
| Medium | Yellow |
| High | Orange |
| Critical | Red |

**Status Colors:**

| Status | Color |
|--------|-------|
| Todo | Slate/Gray |
| Progress | Blue |
| Review | Amber |
| Done | Green |

### Sidebar Features

- **Collapsible** - Click the collapse button to go from 260px to 70px
- **Persistent** - Collapsed state saved to localStorage (survives page refresh)
- **Active indicator** - Current page highlighted with primary color
- **Admin section** - Only visible to admin users
- **User profile** - Bottom section with avatar, name, and dropdown menu

---

## 12. Deployment - Making it Live

### The Deployment Pipeline

```
Developer pushes code to GitHub
         |
Vercel detects the push automatically
         |
Vercel runs: npm install
         |
Vercel runs: prisma generate (generates database client)
         |
Vercel runs: next build (compiles the application)
         |
Build succeeds? -> Deploy to production
         |
DNS routes pm.stanzasoft.ai -> Vercel's edge network
         |
Users see the updated app (zero downtime)
```

### Environment Setup

| Variable | What It's For |
|----------|---------------|
| `DATABASE_URL` | Connection string to Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Encrypts session tokens |
| `NEXTAUTH_URL` | Base URL of the application |
| `GITHUB_CLIENT_ID` | GitHub OAuth app identifier |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `GOOGLE_CLIENT_ID` | Google OAuth app identifier |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app secret |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |
| `R2_ACCOUNT_ID` | Cloudflare R2 account |
| `R2_ACCESS_KEY_ID` | R2 access credentials |
| `R2_SECRET_ACCESS_KEY` | R2 secret credentials |
| `R2_BUCKET_NAME` | R2 storage bucket name |

### Domain Setup

```
GoDaddy (domain registrar)
  stanzasoft.ai -> DNS managed by GoDaddy
    pm.stanzasoft.ai -> CNAME record -> cname.vercel-dns.com
                                          |
                                     Vercel Edge Network
                                          |
                                     Nexus Application
```

---

## 13. Feature-by-Feature Breakdown

### How Each Feature Was Built

#### Feature 1: Kanban Board

| Aspect | Tool/Approach | Why |
|--------|---------------|-----|
| Drag & drop | dnd-kit library | Best React DnD library, touch support |
| State management | Zustand store | Lightweight, handles optimistic updates |
| Task rendering | React.memo | Prevents unnecessary re-renders for performance |
| Column layout | Tailwind CSS flexbox | Responsive, consistent spacing |
| Confetti | canvas-confetti | Lightweight, fun UX touch |
| Task detail | Dialog component | Accessible modal with full task info |

#### Feature 2: AI Sprint Planning

| Aspect | Tool/Approach | Why |
|--------|---------------|-----|
| AI model | Google Gemini 2.5 Flash | Fast, structured JSON output, multimodal |
| Validation | Zod schemas | Type-safe validation of AI responses |
| Image support | Base64 inline data | No storage needed, direct to AI |
| Role matching | Keyword algorithm | Deterministic, fast, no AI needed |
| Two-step flow | React state machine | Users can review before committing |
| Review UI | Editable form | Full control over AI suggestions |

#### Feature 3: Authentication

| Aspect | Tool/Approach | Why |
|--------|---------------|-----|
| Auth library | NextAuth.js v5 | Most popular Next.js auth solution |
| Password hashing | bcrypt | Industry standard, configurable cost factor |
| Session strategy | JWT tokens | Stateless, fast verification |
| GitHub OAuth | NextAuth provider | Built-in support, handles token flow |
| Google OAuth | NextAuth provider | Built-in support, handles token flow |
| Token encryption | AES (lib/crypto) | Protects stored OAuth tokens |

#### Feature 4: File Attachments

| Aspect | Tool/Approach | Why |
|--------|---------------|-----|
| Storage | Cloudflare R2 | No egress fees, S3 compatible |
| Upload method | Presigned URLs | Direct browser-to-cloud, fast |
| SDK | AWS S3 SDK | R2 is S3-compatible |
| Metadata | PostgreSQL | Track file info in relational DB |

#### Feature 5: GitHub Integration

| Aspect | Tool/Approach | Why |
|--------|---------------|-----|
| API client | Octokit | Official GitHub SDK |
| Webhooks | Next.js API route | Receive GitHub events |
| Token storage | AES encryption | Security for stored tokens |
| Sync strategy | Bidirectional | Changes flow both ways |

---

## 14. Feasibility Analysis

### Is This Architecture Production-Ready?

**Short answer: Yes.** Here's why:

#### Scalability

| Concern | How We Handle It | Limit |
|---------|-------------------|-------|
| Users | Neon auto-scales | 10,000+ concurrent users |
| Database size | PostgreSQL with indexes | Millions of rows |
| File storage | Cloudflare R2 CDN | Virtually unlimited |
| Page loads | Vercel edge + caching | Sub-second globally |
| AI requests | Gemini rate limits | ~1000 requests/minute |

#### Cost Analysis (Monthly Estimates)

| Service | Free Tier | Growth (100 users) | Scale (1000 users) |
|---------|-----------|--------------------|--------------------|
| Vercel | Free | $20/month | $50/month |
| Neon (DB) | Free (0.5GB) | $19/month | $49/month |
| Cloudflare R2 | Free (10GB) | $5/month | $15/month |
| Gemini AI | Free (1500 req/day) | $10/month | $50/month |
| Domain | $12/year | $12/year | $12/year |
| **Total** | **~Free** | **~$55/month** | **~$165/month** |

#### What Would Need to Change at Scale?

| At 100 users | At 1,000 users | At 10,000 users |
|-------------|----------------|-----------------|
| Nothing - current setup works | Add database read replicas | Add Redis caching layer |
| | Enable Vercel Pro features | Consider dedicated servers |
| | Monitor API rate limits | Add WebSocket for real-time |
| | Add error tracking (Sentry) | Add message queue for AI |

#### Strengths of This Architecture

1. **Server-side rendering** - SEO-friendly, fast initial page loads
2. **Type safety end-to-end** - TypeScript + Prisma + Zod = fewer runtime errors
3. **Optimistic UI** - Feels fast even on slow connections
4. **Modular design** - Can swap any piece (database, AI provider, storage) without rewriting everything
5. **Cost-effective** - Can run entirely on free tiers for development
6. **Modern stack** - Uses current best practices, will be maintainable for years

#### Potential Improvements

1. **Real-time collaboration** - Add WebSockets so multiple users see changes instantly
2. **Offline support** - Service workers for working without internet
3. **Advanced analytics** - Charts showing team velocity, burndown, cycle time
4. **Email notifications** - Send notification emails for task assignments
5. **Mobile app** - React Native app using the same server actions
6. **Advanced AI** - Multi-model approach (Claude for analysis, Gemini for generation)

---

## 15. Glossary of Terms

| Term | Simple Explanation |
|------|-------------------|
| **API** | A way for software to talk to other software. Like a waiter taking orders between you and the kitchen. |
| **Authentication** | Proving who you are (logging in). |
| **Authorization** | What you're allowed to do after logging in. |
| **Base64** | A way to represent binary data (like images) as text. |
| **bcrypt** | A tool that turns passwords into unreadable hashes for security. |
| **Cache** | Stored copy of data for faster access. Like keeping a photocopy on your desk instead of going to the filing cabinet every time. |
| **CDN** | Content Delivery Network - servers around the world that store copies of your files so users download from the closest one. |
| **Client** | The user's browser. "Client-side" means code running in the browser. |
| **Component** | A reusable piece of UI. Like a LEGO block for web pages. |
| **CRUD** | Create, Read, Update, Delete - the four basic operations on data. |
| **CSS** | The language that controls how web pages look (colors, fonts, layout). |
| **Database** | Organized storage for application data, like a digital filing cabinet. |
| **Deployment** | Making your app available on the internet. |
| **DNS** | Domain Name System - translates "pm.stanzasoft.ai" into a server's IP address. |
| **Drag and Drop** | Click and hold to move something, release to place it. |
| **Endpoint** | A specific URL that accepts requests (like a door to a specific room). |
| **Environment Variable** | A secret value stored on the server (like API keys, passwords). |
| **Framework** | A pre-built structure for building applications. Like a house frame - you fill in the walls and details. |
| **Frontend** | The part of the app users see and interact with. |
| **Git** | A version control system - tracks every change ever made to code. |
| **Hash** | A one-way mathematical function. Converts data into a fixed-size string. |
| **HTML** | The language that defines the structure of web pages. |
| **HTTP** | The protocol browsers use to communicate with servers. |
| **Index (Database)** | A data structure that speeds up searches, like a book's index. |
| **JavaScript** | The programming language that makes web pages interactive. |
| **JSON** | JavaScript Object Notation - a format for structuring data. |
| **JWT** | JSON Web Token - a small encrypted token for user sessions. |
| **Kanban** | A visual system for managing work using cards and columns. |
| **Library** | Pre-written code you can use in your project. |
| **Middleware** | Code that runs between a request and a response (like a security checkpoint). |
| **Migration** | A change to the database structure (adding/removing tables or columns). |
| **Multimodal** | AI that can understand multiple types of input (text + images). |
| **OAuth** | A protocol for "Sign in with Google/GitHub" - lets users log in without creating a new password. |
| **Optimistic Update** | Updating the UI before the server confirms - makes things feel faster. |
| **ORM** | Object-Relational Mapper - lets you use programming language syntax instead of SQL. |
| **PostgreSQL** | A powerful open-source relational database. |
| **Presigned URL** | A temporary, secure link that allows direct upload/download to cloud storage. |
| **Prisma** | A TypeScript ORM for database operations. |
| **Props** | Data passed from a parent component to a child component in React. |
| **React** | A JavaScript library for building user interfaces with reusable components. |
| **Revalidation** | Refreshing cached data when it changes. |
| **Route** | A URL path that maps to a specific page. `/settings` is a route. |
| **Schema** | A definition of data structure. What fields exist, what types they are. |
| **Server** | A computer that processes requests and sends responses. "Server-side" means code running on the server. |
| **Server Action** | A function that runs on the server but can be called from the browser. |
| **Serverless** | Code that runs on-demand without managing servers. Scales automatically. |
| **Sprint** | A fixed time period (usually 2 weeks) where a team works on a set of tasks. |
| **SQL** | Structured Query Language - the language for communicating with databases. |
| **State** | Data that can change over time in a component (like whether a modal is open). |
| **Tailwind CSS** | A CSS framework using utility classes directly in HTML. |
| **Token** | A piece of data used for authentication (like a digital ID card). |
| **Transaction** | A group of database operations that either all succeed or all fail together. |
| **TypeScript** | JavaScript with type annotations for catching errors early. |
| **UI** | User Interface - what the user sees and interacts with. |
| **URL** | Uniform Resource Locator - a web address like `pm.stanzasoft.ai/settings`. |
| **UUID** | Universally Unique Identifier - a random string used as an ID. |
| **Vercel** | A cloud platform for deploying web applications. |
| **Webhook** | An automatic notification sent from one service to another when something happens. |
| **WebSocket** | A persistent connection between browser and server for real-time communication. |
| **Zod** | A TypeScript library for validating data structures. |
| **Zustand** | A lightweight state management library for React. |

---

## Summary

Nexus is a full-stack, production-ready project management application that demonstrates modern web development best practices:

- **220+ files** across frontend, backend, database, and AI layers
- **8 database models** with proper relationships and indexing
- **3 authentication methods** (email/password, GitHub, Google)
- **AI-powered planning** with multimodal image support
- **Real-time Kanban board** with drag-and-drop and optimistic updates
- **GitHub integration** with bidirectional sync
- **File storage** with Cloudflare R2 and presigned URLs
- **Responsive design** supporting desktop and mobile
- **Dark mode** throughout the application
- **Role-based access control** (admin/member)

The architecture is designed to be maintainable, scalable, and cost-effective, running entirely on free tiers during development and scaling gracefully as the user base grows.

---

*Documentation generated for the Nexus project at https://pm.stanzasoft.ai/*
*Built by Vyshanvi with AI assistance from Claude*

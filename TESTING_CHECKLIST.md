# Testing Checklist

Use this checklist to verify Nexus is working correctly.

## Prerequisites

- [ ] Environment variables configured in `.env`
- [ ] Database migrations run (`npm run db:migrate`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Dev server running (`npm run dev`)

## 1. Authentication Flow

### Registration
- [ ] Navigate to `/register`
- [ ] Create new account with:
  - Name: Test User
  - Email: test@example.com
  - Password: test123
- [ ] Success message appears
- [ ] Redirected to login page

### Login
- [ ] Navigate to `/login`
- [ ] Login fails with wrong password
- [ ] Login succeeds with correct credentials
- [ ] Redirected to `/dashboard`
- [ ] User name appears in header

### Session Persistence
- [ ] Refresh page - still logged in
- [ ] Navigate to `/login` - redirected to dashboard
- [ ] Logout works
- [ ] Navigate to `/dashboard` - redirected to login

## 2. Dashboard (Member View)

Login as: `user@nexus.com` / `user123`

- [ ] Dashboard shows "Welcome back" message
- [ ] "Demo Project" card is visible
- [ ] Card shows sprint count (1)
- [ ] Card shows member count (2)
- [ ] Click project card navigates to project page

## 3. Project View

On `/dashboard/projects/{projectId}`:

- [ ] Project name "Demo Project" displayed
- [ ] Project description visible
- [ ] Vertical name shown (Engineering)
- [ ] Active sprint name displayed (Sprint 1)
- [ ] Sprint dates shown correctly
- [ ] Task count displayed (4 tasks)

## 4. Kanban Board

### Visual Check
- [ ] Four columns visible: To Do, In Progress, Review, Done
- [ ] Each column shows task count
- [ ] Tasks distributed across columns:
  - Todo: 1 task
  - In Progress: 1 task
  - Review: 1 task
  - Done: 1 task

### Task Cards
- [ ] Task titles visible
- [ ] Task type icons shown (✓, 🐛, 📖)
- [ ] Priority badges display colors correctly
- [ ] Story points visible on cards
- [ ] Assignee names shown

### Drag and Drop
- [ ] Pick up a task from "To Do"
- [ ] Hover over "In Progress" column
- [ ] Drop task - it moves
- [ ] Task updates optimistically (instant)
- [ ] Refresh page - task stayed in new column
- [ ] Try moving task back - works both ways

### Error Handling
*Note: This requires network throttling or temporary DB disconnect*
- [ ] Simulate network error during drag
- [ ] Task reverts to original position
- [ ] (Future: Error toast should appear)

## 5. Project Details

Scroll down on project page:

### Members Section
- [ ] "Project Members" card visible
- [ ] Admin User listed
- [ ] Demo User listed
- [ ] Email addresses shown

### Sprint History
- [ ] "Sprint History" card visible
- [ ] Sprint 1 listed
- [ ] Status badge shows "active" (green)
- [ ] Task count shown (4)

## 6. Admin Functions

Login as: `admin@nexus.com` / `admin123`

### Dashboard Admin View
- [ ] "Verticals" link in navigation
- [ ] "Admin" link in navigation
- [ ] Same project list as member

### Project Page Admin View
- [ ] "Manage Sprints" button visible
- [ ] Click navigates to sprints page (or 404 if UI not implemented)

## 7. Database Verification

Open Prisma Studio: `npm run db:studio`

### Check Data Integrity
- [ ] Users table has 2 users
- [ ] Both users have `role` field set correctly
- [ ] Passwords are hashed (not plain text)
- [ ] Vertical "Engineering" exists
- [ ] VerticalUser entries link users to vertical
- [ ] Project "Demo Project" exists
- [ ] ProjectMember entries link users to project
- [ ] Sprint exists with status "active"
- [ ] 4 tasks exist with different statuses

### Check Relationships
- [ ] Click on a task
- [ ] Sprint relationship shows Sprint 1
- [ ] Assignee relationship shows user
- [ ] Creator relationship shows admin

## 8. Backend API Testing

Use Prisma Studio or direct server actions:

### Create Vertical (Admin Only)
```typescript
// Should succeed
await createVertical("Product")

// Should fail if not admin
// Login as member and try - should throw error
```

### Create Project (Admin Only)
```typescript
await createProject({
  name: "Test Project",
  description: "Testing",
  verticalId: "engineering-vertical-id"
})
```

### Create Sprint (Admin Only)
```typescript
await createSprint({
  projectId: "demo-project-id",
  name: "Sprint 2",
  startDate: new Date(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
})
```

### Activate Sprint (Admin Only)
```typescript
// Try activating Sprint 2 while Sprint 1 is active
// Should fail with error about existing active sprint
```

### Create Task (Member Can Do)
```typescript
await createTask({
  sprintId: "sprint-id",
  title: "Test Task",
  description: "Testing task creation",
  type: "task",
  status: "todo",
  priority: "medium"
})
```

## 9. AI Features Testing

*Requires ANTHROPIC_API_KEY in .env*

### AI Sprint Generation
```typescript
await aiGenerateSprintTasks(
  "sprint-id",
  "Build a user profile page with avatar upload, bio editing, and social links"
)
```

Expected:
- [ ] Returns success message
- [ ] Creates story task
- [ ] Creates child tasks under story
- [ ] Tasks appear in Kanban board
- [ ] Story points assigned

### AI Bug Classification
```typescript
await createTask({
  sprintId: "sprint-id",
  title: "Login page crashes",
  description: "When I click login with wrong password, the entire app crashes and shows white screen",
  type: "bug"
})
```

Expected:
- [ ] Task created
- [ ] Priority automatically set to "critical" or "high"
- [ ] Check after 2-3 seconds (async)

## 10. File Upload Testing

*Requires R2 credentials in .env*

```typescript
// Request upload URL
const { uploadUrl, key } = await requestUploadUrl({
  taskId: "task-id",
  fileName: "screenshot.png",
  mimeType: "image/png",
  fileSize: 1024 * 500 // 500KB
})

// Upload file using fetch to uploadUrl
// Then save metadata
await saveAttachmentMetadata({
  taskId: "task-id",
  key: key,
  fileName: "screenshot.png",
  mimeType: "image/png",
  sizeBytes: 1024 * 500
})
```

Expected:
- [ ] Upload URL generated
- [ ] File uploaded to R2
- [ ] Metadata saved in database
- [ ] (Future: Attachment shown on task card)

## 11. Security Testing

### Authorization Checks
- [ ] Member cannot access `/dashboard/admin/*`
- [ ] Cannot create vertical as member
- [ ] Cannot create project as member
- [ ] Cannot activate sprint as member
- [ ] Can create tasks in assigned projects
- [ ] Cannot create tasks in unassigned projects

### Authentication Checks
- [ ] Cannot access `/dashboard` without login
- [ ] Invalid JWT redirects to login
- [ ] Expired session redirects to login

### Data Validation
- [ ] Cannot create sprint with end date before start date
- [ ] Cannot upload file > 10MB
- [ ] Cannot assign task to non-member
- [ ] Cannot create task in inactive sprint (no restriction yet)

## 12. Responsive Design

### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] All columns visible on Kanban
- [ ] Navigation works
- [ ] No horizontal scroll

### Tablet (768x1024)
- [ ] Layout adjusts
- [ ] Kanban scrolls horizontally
- [ ] Cards readable
- [ ] Forms work

### Mobile (375x667)
- [ ] Login/register forms work
- [ ] Dashboard cards stack
- [ ] Kanban scrollable
- [ ] Navigation accessible

## 13. Performance

### Page Load
- [ ] Dashboard loads < 2s
- [ ] Project page loads < 2s
- [ ] Kanban board renders < 1s

### Interactions
- [ ] Drag response instant
- [ ] Task update < 500ms
- [ ] Navigation instant

### Network
- [ ] Check Network tab - minimal requests
- [ ] Server components reduce client JS
- [ ] Images optimized (if any)

## 14. Error States

### Network Errors
- [ ] Disconnect internet
- [ ] Try to update task
- [ ] Error handled gracefully

### Database Errors
*Requires temporarily breaking DATABASE_URL*
- [ ] Shows error page
- [ ] Doesn't expose DB details

### Validation Errors
- [ ] Create task with empty title
- [ ] Upload file too large
- [ ] Invalid email format

## Issue Reporting Template

If you find a bug:

```markdown
**Issue**: [Brief description]
**Steps to Reproduce**:
1.
2.
3.

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Environment**:
- Browser:
- OS:
- Node version:
- Database:

**Error Message** (if any):
```

## Success Criteria

Minimum to consider MVP working:
- ✅ All authentication flows work
- ✅ Dashboard displays projects
- ✅ Kanban board shows tasks
- ✅ Drag and drop updates tasks
- ✅ Database relationships intact
- ✅ Admin/member roles enforced
- ✅ No console errors
- ✅ Responsive on mobile

With AI enabled:
- ✅ Sprint generation works
- ✅ Bug classification works
- ✅ No API errors

Full feature set:
- ✅ All CRUD operations work
- ✅ File uploads work
- ✅ Comments work
- ✅ All admin panels functional

---

**Testing Progress**: Mark items as you complete them.
**Report issues**: Create GitHub issues or add to IMPLEMENTATION_STATUS.md

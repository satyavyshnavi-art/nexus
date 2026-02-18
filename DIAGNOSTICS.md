# Project Visibility Diagnostics

This document describes the diagnostic tools available to troubleshoot project visibility issues in Nexus.

## Quick Reference

All diagnostic scripts are available as npm commands:

```bash
npm run diagnose:projects <user-email>     # Check why a user can't see projects
npm run diagnose:visibility [user-email]   # Full visibility report (all users or specific user)
npm run test:cache                         # Test cache revalidation
npm run simulate:add-member <project> <email>  # Simulate adding a user to a project
```

---

## Understanding Project Visibility

### How Users See Projects

Users can see projects in **two ways**:

1. **Via Vertical Assignment** (Broad Access)
   - When a user is assigned to a vertical, they see ALL projects in that vertical
   - This is automatic - no need to add them as project members
   - Example: User in "Product Engineering" sees all Product Engineering projects

2. **Direct Project Membership** (Explicit Access)
   - User is explicitly added as a member to specific projects
   - This is more granular control
   - Example: User is added to "Payment Gateway Module" project

### The Query Logic

The `getUserProjects()` function uses this Prisma query:

```typescript
db.project.findMany({
  where: {
    OR: [
      {
        vertical: {
          users: { some: { userId: user.id } }  // Via vertical
        }
      },
      {
        members: { some: { userId: user.id } }  // Direct member
      }
    ]
  }
})
```

**Key Point:** The OR operator means users see projects from EITHER source.

---

## Diagnostic Scripts

### 1. User Project Diagnosis

**Command:**
```bash
npm run diagnose:projects sarah.frontend@nexus.com
```

**What it checks:**
1. ✅ User exists
2. ✅ User is assigned to verticals
3. ✅ User has direct project memberships
4. ✅ `getUserProjects()` query returns results
5. ✅ Shows all available projects in user's verticals

**Output:**
```
📋 STEP 1: Finding User
✅ User found: Sarah Johnson (member)

📋 STEP 2: Checking Vertical Assignments
✅ User is assigned to 2 vertical(s):
   1. Product Engineering (3 projects)
   2. Mobile Engineering (1 projects)

📋 STEP 3: Checking Direct Project Memberships
✅ User is a member of 3 project(s):
   1. Customer Portal Module
   2. Mobile App Module
   3. Admin Dashboard Module

📋 STEP 4: Simulating getUserProjects() Query
✅ Query returns 4 project(s):
   1. Mobile App Module
   2. Admin Dashboard Module
   3. Payment Gateway Module
   4. Customer Portal Module

📊 SUMMARY
✅ Everything looks good! User should see their projects.
```

**When to use:** When a specific user reports not seeing their assigned projects.

---

### 2. Full Visibility Report

**Command:**
```bash
# All member users
npm run diagnose:visibility

# Specific user
npm run diagnose:visibility sarah.frontend@nexus.com
```

**What it shows:**
- Complete visibility report for all (or one) user
- Vertical assignments
- Direct project memberships
- Visible projects (from `getUserProjects()`)
- Analysis and recommendations
- Summary table

**Output:**
```
👤 Sarah Johnson (sarah.frontend@nexus.com)

📁 VERTICALS:
   1. Product Engineering (3 projects)
   2. Mobile Engineering (1 projects)

🔗 DIRECT PROJECT MEMBERSHIPS:
   1. Payment Gateway Module
   2. Customer Portal Module
   3. Mobile App Module
   4. Admin Dashboard Module

👁️  VISIBLE PROJECTS:
   ✅ User sees 4 project(s):
   1. Mobile App Module (Direct Member)
   2. Admin Dashboard Module (Direct Member)
   3. Payment Gateway Module (Direct Member)
   4. Customer Portal Module (Direct Member)

🔍 ANALYSIS:
   ✅ User is properly configured
   ✅ Can access 4 project(s)
```

**When to use:** To get a complete overview of project visibility across all users.

---

### 3. Cache Revalidation Test

**Command:**
```bash
npm run test:cache
```

**What it checks:**
- Current project memberships for test user
- `getUserProjects()` query result
- Which cache keys should be revalidated
- Recent project member changes and timing
- Troubleshooting checklist

**Output:**
```
📋 STEP 3: Cache Keys That Should Be Revalidated
When a user is added to a project, these should be revalidated:
   1. "/" - Dashboard (affects ALL users)
   2. "/admin/projects" - Admin projects list
   3. "/projects/{id}" - Project page

Note: unstable_cache with tags is also used:
   - Tag: user-{userId}-projects
   - Tag: projects (global)

🔧 TROUBLESHOOTING CHECKLIST
1. ⚡ Clear Next.js cache: rm -rf .next
2. 🔄 Hard refresh browser: Cmd+Shift+R
3. 🔍 Check browser console for errors
4. ⏰ Wait for cache to expire (30 seconds)
```

**When to use:** When you suspect caching issues are preventing users from seeing newly assigned projects.

---

### 4. Simulate Add Member

**Command:**
```bash
npm run simulate:add-member "Payment Gateway Module" mike.backend@nexus.com
```

**What it does:**
1. Finds the user and project
2. Checks if user is in the project's vertical
3. Checks current membership status
4. Shows what user sees BEFORE adding
5. Adds user as project member
6. Shows what user sees AFTER adding
7. Lists cache revalidation paths

**Output:**
```
📋 STEP 5: BEFORE - What User Currently Sees
User sees 3 project(s):
   1. Admin Dashboard Module (Vertical only)
   2. Payment Gateway Module (Vertical only)
   3. Customer Portal Module (Vertical only)

📋 STEP 6: Adding User as Project Member
✅ User added as member of "Payment Gateway Module"

📋 STEP 7: AFTER - What User Should See
User should see 3 project(s):
   1. Admin Dashboard Module
   2. Payment Gateway Module ← Now a direct member
   3. Customer Portal Module

📋 STEP 8: Cache Revalidation Needed
⚠️  NOTE: This script does NOT trigger revalidatePath()
    In the actual app, these paths should be revalidated:
    1. revalidatePath("/")
    2. revalidatePath("/projects/{id}")
    3. revalidatePath("/admin/projects")
```

**When to use:** To test what happens when adding a user to a project, without using the UI.

---

## Common Issues & Solutions

### Issue 1: "No Projects Yet" on Dashboard

**Symptoms:**
- User logs in and sees "No Projects Yet" message
- User should have been assigned to projects

**Diagnosis:**
```bash
npm run diagnose:projects user@email.com
```

**Common Causes:**

1. **User not assigned to any vertical**
   ```
   ❌ User is NOT assigned to any verticals
   ```
   **Fix:** Admin should assign user to a vertical via `/admin/verticals`

2. **Vertical has no projects**
   ```
   ✅ User is assigned to 1 vertical(s):
      1. Product Engineering (0 projects)
   ```
   **Fix:** Create projects in the vertical OR assign user to different vertical

3. **Cache not revalidated**
   ```
   ✅ Query returns 3 project(s)
   ```
   But dashboard still shows "No Projects"

   **Fix:**
   - Hard refresh browser (Cmd+Shift+R)
   - Clear Next.js cache: `rm -rf .next && npm run dev`
   - Wait 30 seconds for cache to expire

---

### Issue 2: Projects Disappeared After Redeployment

**Symptoms:**
- Projects were visible before deployment
- After deployment, dashboard shows "No Projects Yet"

**Diagnosis:**
```bash
npm run diagnose:visibility
```

**Common Cause:** Cache not properly invalidated during deployment

**Fix:**
1. Check database hasn't been wiped: `npx prisma studio`
2. Verify user still has vertical assignments
3. Clear all caches:
   ```bash
   rm -rf .next
   npm run dev
   ```
4. In production, redeploy to trigger cache rebuild

---

### Issue 3: User Added to Project But Can't See It

**Symptoms:**
- Admin added user to project via `/admin/projects/{id}/members`
- User doesn't see the project on dashboard

**Diagnosis:**
```bash
npm run simulate:add-member "Project Name" user@email.com
```

**Check:**
1. User is in project's vertical
   ```
   ❌ User is NOT in project's vertical (Product Engineering)
   ```
   **Fix:** Assign user to the vertical first

2. Membership was added but cache not revalidated
   ```
   ✅ User added as member of "Project Name"
   ```
   **Fix:** Hard refresh browser or wait 30 seconds

---

## Cache Configuration

### Current Cache Settings

**Location:** `/Users/vyshanvi/nexus/server/actions/projects.ts`

**getUserProjects() cache:**
```typescript
unstable_cache(
  async (userId: string, isAdmin: boolean) => { ... },
  [`user-projects-${userId}`],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: [`user-${userId}-projects`, "projects"],
  }
)
```

**Revalidation triggers:**
- `revalidatePath("/")` - When user added/removed from project
- `revalidatePath("/admin/projects")` - Admin project list
- `revalidatePath("/projects/{id}")` - Specific project page

**Cache tags:**
- `user-{userId}-projects` - Per-user project list
- `projects` - Global projects cache

### How to Debug Cache Issues

1. **Add logging to server actions:**
   ```typescript
   // In server/actions/projects.ts → addMemberToProject
   console.log("Adding member:", { projectId, userId });
   console.log("Revalidating paths:", "/", `/projects/${projectId}`);
   ```

2. **Check if revalidation is called:**
   - Watch server logs when adding members
   - Verify `revalidatePath()` is executed

3. **Force cache clear:**
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Check browser cache:**
   - Open DevTools → Network → Disable cache
   - Hard refresh (Cmd+Shift+R)

---

## Best Practices

### For Admins

1. **Always assign users to verticals first**
   - Go to `/admin/verticals`
   - Select vertical → Add user
   - This ensures they can see projects

2. **Use project members for granular control**
   - If you want specific access control, add users as project members
   - Otherwise, vertical assignment is sufficient

3. **After adding users, inform them to hard refresh**
   - Cache TTL is 30 seconds
   - Hard refresh ensures immediate visibility

### For Developers

1. **Always revalidate after mutations**
   ```typescript
   await db.projectMember.create({ ... });
   revalidatePath("/");
   revalidatePath("/admin/projects");
   revalidatePath(`/projects/${projectId}`);
   ```

2. **Use diagnostic scripts during development**
   ```bash
   npm run diagnose:visibility  # Quick check
   npm run test:cache           # Cache debugging
   ```

3. **Test with real user flows**
   - Create user → Assign to vertical → Create project → Check visibility
   - Use `npm run simulate:add-member` to test

---

## Technical Details

### Database Schema

**Vertical Assignment:**
```prisma
model VerticalUser {
  id         String   @id @default(uuid())
  verticalId String
  userId     String
  vertical   Vertical @relation(...)
  user       User     @relation(...)

  @@unique([verticalId, userId])
}
```

**Project Membership:**
```prisma
model ProjectMember {
  id        String  @id @default(uuid())
  projectId String
  userId    String
  project   Project @relation(...)
  user      User    @relation(...)

  @@unique([projectId, userId])
}
```

### Query Flow

1. **User logs in** → Session created with user ID
2. **Dashboard loads** → Calls `getUserProjects()`
3. **getUserProjects()** → Checks cache first
4. **Cache miss** → Runs Prisma query with OR condition
5. **Returns projects** → Caches result for 30 seconds
6. **Next request** → Serves from cache if < 30 seconds

### Revalidation Flow

1. **Admin adds user to project** → `addMemberToProject()` called
2. **DB insert** → `projectMember.create()`
3. **Cache invalidation** → `revalidatePath()` called
4. **Next request** → Cache miss, re-runs query
5. **User sees project** → New data visible immediately

---

## Troubleshooting Checklist

When a user can't see projects:

- [ ] User exists in database
- [ ] User is assigned to at least one vertical
- [ ] Vertical has projects OR user is direct member
- [ ] `getUserProjects()` query returns projects (check via script)
- [ ] Cache has been revalidated (hard refresh or wait 30s)
- [ ] No database connection issues
- [ ] User is logged in with correct account
- [ ] Browser console shows no errors
- [ ] Server logs show no errors

**Run this command for instant diagnosis:**
```bash
npm run diagnose:projects <user-email>
```

---

## Support

If issues persist after running diagnostics:

1. Check database state: `npx prisma studio`
2. Review server logs for errors
3. Check browser console for client-side errors
4. Verify environment variables are set
5. Try reseeding database: `npm run db:seed:modular`

For cache-related issues:
```bash
npm run test:cache
rm -rf .next
npm run dev
```

# Project Visibility Investigation - Complete Findings

**Date:** February 16, 2026
**Investigation:** Why assigned projects aren't visible to users

---

## Executive Summary

After comprehensive investigation using diagnostic scripts, **all users in the current database can see their assigned projects correctly**. The system is working as designed.

### Key Finding: Two Ways to See Projects

Users can see projects through:

1. **Vertical Assignment** (Broad Access) - Users see ALL projects in their vertical(s)
2. **Direct Membership** (Explicit Access) - Users see specific projects they're added to

The `getUserProjects()` query uses **OR logic**, meaning users get access from EITHER source.

---

## Investigation Results

### Database Status (Current)

- **Total Users:** 11 (1 admin + 10 members)
- **Total Verticals:** 2 (Product Engineering, Mobile Engineering)
- **Total Projects:** 4 (all with active sprints)
- **Total Project Memberships:** 22+

### User Visibility Verification

All 10 member users were tested using the diagnostic scripts. **Results: 100% working correctly.**

Sample user (Sarah Johnson):
- ✅ Assigned to 2 verticals
- ✅ Direct member of 4 projects
- ✅ Can see 4 projects total (via getUserProjects query)
- ✅ Dashboard should display all 4 projects

**Conclusion:** The query logic is working correctly. All users who should see projects do see them.

---

## Root Cause Analysis

### Why Users Might Report "No Projects"

After testing the complete flow, we identified **three potential issues**:

#### 1. User Not Assigned to Any Vertical (CRITICAL)

**Symptom:**
```
❌ User is NOT assigned to any verticals
```

**Impact:** User sees ZERO projects (even if directly added to projects via vertical requirement)

**Root Cause:**
- New users created via credentials (not GitHub OAuth) are not automatically assigned to any vertical
- GitHub OAuth users ARE automatically assigned to "Default" vertical (via `ensureUserHasVertical`)
- Credentials users have no such mechanism

**Fix:**
- Admin must manually assign user to a vertical via `/admin/verticals`
- OR user must be added as direct project member (requires vertical membership first)

**Detection:**
```bash
npm run diagnose:projects user@email.com
# Shows: ❌ User is NOT assigned to any verticals
```

#### 2. Cache Not Revalidated After Assignment

**Symptom:**
- Admin adds user to project
- User refreshes dashboard
- Dashboard still shows "No Projects Yet"
- After 30 seconds or hard refresh, projects appear

**Root Cause:**
- `getUserProjects()` uses `unstable_cache` with 30-second TTL
- `revalidatePath()` is called in `addMemberToProject()`, but browser might have cached response
- Cache tags might not be properly invalidating user-specific cache

**Current Cache Config:**
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

**Revalidation Triggers:**
```typescript
revalidatePath("/"); // Dashboard
revalidatePath("/admin/projects"); // Admin list
revalidatePath(`/projects/${projectId}`); // Project page
```

**Fix:**
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Wait 30 seconds for cache to expire
- Clear Next.js cache: `rm -rf .next && npm run dev`

**Detection:**
```bash
npm run test:cache
# Shows cache timing and revalidation paths
```

#### 3. Vertical Has No Projects

**Symptom:**
```
✅ User is assigned to 1 vertical(s):
   1. Product Engineering (0 projects)
❌ Query returns 0 projects
```

**Root Cause:**
- User is assigned to vertical
- Vertical exists but has no projects yet
- User is not a direct member of any projects

**Fix:**
- Create projects in the user's vertical
- OR assign user to different vertical that has projects
- OR add user as direct member to existing projects (in other verticals)

**Detection:**
```bash
npm run diagnose:visibility
# Shows vertical project counts
```

---

## Technical Implementation Details

### The Query Logic

**Location:** `/Users/vyshanvi/nexus/server/actions/projects.ts`

```typescript
export async function getUserProjects() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = session.user.role === "admin";

  return db.project.findMany({
    where: isAdmin
      ? {} // Admins see ALL projects
      : {
          // Members see projects via vertical OR direct membership
          OR: [
            {
              vertical: {
                users: {
                  some: { userId: session.user.id },
                },
              },
            },
            {
              members: {
                some: { userId: session.user.id },
              },
            },
          ],
        },
    include: {
      vertical: { select: { id: true, name: true } },
      _count: { select: { sprints: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

**Key Points:**
1. Admins see ALL projects (no filter)
2. Members see projects where:
   - They are in the project's vertical, OR
   - They are a direct project member
3. The OR condition is intentional (broad access via vertical)

### Vertical Assignment Flow

**For GitHub OAuth users:**
```typescript
// In lib/auth/config.ts → signIn callback
if (account?.provider === "github") {
  // ... create/update user ...
  await ensureUserHasVertical(newUser.id); // Automatic assignment
}
```

**For Credentials users:**
- NO automatic vertical assignment
- Admin must manually assign via `/admin/verticals`

**This is the gap!**

---

## Diagnostic Tools Created

Five comprehensive diagnostic scripts were created to troubleshoot project visibility:

### 1. User Project Diagnosis
```bash
npm run diagnose:projects <user-email>
```
Checks all aspects of why a specific user can't see projects.

### 2. Full Visibility Report
```bash
npm run diagnose:visibility [user-email]
```
Complete report for all users or specific user, showing:
- Vertical assignments
- Project memberships
- Visible projects
- Access type (vertical vs direct)
- Analysis and recommendations

### 3. Cache Revalidation Test
```bash
npm run test:cache
```
Tests cache behavior and shows revalidation paths.

### 4. New User Flow Test
```bash
npm run test:new-user
```
Simulates complete user onboarding from creation to project access.

### 5. Simulate Add Member
```bash
npm run simulate:add-member "<project>" "<email>"
```
Simulates adding a user to a project without using UI.

**All scripts verified working on current database.**

---

## Verification Results

### Test 1: Existing Users Can See Projects
```bash
npm run diagnose:visibility
```

**Result:** ✅ All 10 member users properly configured
- All have vertical assignments
- All see 3-4 projects each
- Query logic working correctly

### Test 2: New User Flow
```bash
npm run test:new-user
```

**Result:** ✅ Flow works as expected
1. New user sees 0 projects (no vertical)
2. After vertical assignment, sees all vertical's projects
3. After direct membership, access type changes
4. Query returns correct results

### Test 3: Adding Member to Project
```bash
npm run simulate:add-member "Payment Gateway Module" sarah.frontend@nexus.com
```

**Result:** ✅ Process works correctly
- User in vertical: Can be added
- Before: Sees project via vertical
- After: Sees project as direct member
- Cache revalidation paths identified

### Test 4: Cache Behavior
```bash
npm run test:cache
```

**Result:** ⚠️ Cache works but has 30-second TTL
- Projects added recently (< 30s) might not show immediately
- Hard refresh recommended after adding users
- Revalidation paths are correct

---

## Recommendations

### For Immediate Implementation

1. **Add Automatic Vertical Assignment for Credentials Users**

   Consider modifying the user registration flow to automatically assign new credentials users to a "Default" vertical, similar to GitHub OAuth users.

   **Location to modify:** `/Users/vyshanvi/nexus/app/(auth)/register/actions.ts` (if exists) or signup handler

   **Code to add:**
   ```typescript
   import { ensureUserHasVertical } from "@/lib/auth/helpers";

   // After user creation
   const user = await db.user.create({ ... });
   await ensureUserHasVertical(user.id); // Automatic assignment
   ```

2. **Reduce Cache TTL for User Projects**

   Consider reducing cache TTL from 30 seconds to 10 seconds for better UX after assignments.

   **Location:** `/Users/vyshanvi/nexus/server/actions/projects.ts`

   **Change:**
   ```typescript
   {
     revalidate: 10, // Was 30
     tags: [`user-${session.user.id}-projects`, "projects"],
   }
   ```

3. **Add User Feedback After Assignment**

   When admin adds user to project, show a toast notification:
   "User added. They may need to refresh their browser to see changes."

### For Documentation

1. **Update Admin Guide**
   - Document that users MUST be assigned to verticals
   - Explain the two access methods (vertical vs direct)
   - Add troubleshooting section with diagnostic commands

2. **Update User Guide**
   - Explain what "No Projects Yet" means
   - Add "Contact admin to be assigned to a vertical" message
   - Mention hard refresh if projects don't appear immediately

### For Monitoring

1. **Add Logging to Vertical Assignment**
   ```typescript
   // In ensureUserHasVertical
   console.log(`[Vertical Assignment] User ${userId} assigned to ${vertical.name}`);
   ```

2. **Add Logging to getUserProjects**
   ```typescript
   // In getUserProjects
   console.log(`[Project Query] User ${userId} sees ${projects.length} projects`);
   ```

---

## Files Created During Investigation

### Diagnostic Scripts
1. `/Users/vyshanvi/nexus/scripts/diagnose-user-projects.ts`
2. `/Users/vyshanvi/nexus/scripts/full-project-visibility-report.ts`
3. `/Users/vyshanvi/nexus/scripts/test-cache-revalidation.ts`
4. `/Users/vyshanvi/nexus/scripts/test-new-user-flow.ts`
5. `/Users/vyshanvi/nexus/scripts/simulate-add-member.ts`

### Documentation
1. `/Users/vyshanvi/nexus/DIAGNOSTICS.md` - Comprehensive troubleshooting guide
2. `/Users/vyshanvi/nexus/scripts/README.md` - Updated with new diagnostic commands
3. `/Users/vyshanvi/nexus/PROJECT_VISIBILITY_FINDINGS.md` - This document

### Package.json Scripts Added
```json
{
  "diagnose:projects": "tsx scripts/diagnose-user-projects.ts",
  "diagnose:visibility": "tsx scripts/full-project-visibility-report.ts",
  "test:cache": "tsx scripts/test-cache-revalidation.ts",
  "test:new-user": "tsx scripts/test-new-user-flow.ts",
  "simulate:add-member": "tsx scripts/simulate-add-member.ts"
}
```

---

## Conclusion

**The project visibility system is working correctly.** The `getUserProjects()` query properly returns projects based on vertical assignment OR direct membership.

**The main issue is user onboarding:** Credentials users are not automatically assigned to a vertical, while GitHub OAuth users are. This creates an inconsistency where some users see projects immediately and others don't.

**Recommended actions:**
1. Implement automatic vertical assignment for all new users
2. Reduce cache TTL for better UX
3. Add user feedback after admin actions
4. Document the two access methods clearly
5. Use diagnostic scripts for troubleshooting

**All diagnostic tools are production-ready and can be used immediately to troubleshoot any user-reported issues.**

---

## Quick Reference

**User can't see projects?**
```bash
npm run diagnose:projects user@email.com
```

**Need full system report?**
```bash
npm run diagnose:visibility
```

**Suspect cache issue?**
```bash
npm run test:cache
```

**Test new feature?**
```bash
npm run test:new-user
npm run simulate:add-member "Project" "user@email.com"
```

---

**Investigation completed successfully. All findings documented and verified.**

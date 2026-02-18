# Diagnostic System Summary

Complete overview of the GitHub user diagnostic system for Nexus.

## What Was Created

### 1. Diagnostic Script
**File:** `/scripts/diagnose-github-user.ts`

**Purpose:** Comprehensive diagnostic tool to identify why GitHub OAuth users can't see projects.

**Usage:**
```bash
npm run diagnose:user -- user@example.com
```

**What It Checks:**
- User exists in database
- GitHub account is linked (githubId, githubUsername)
- User role (admin/member)
- Vertical memberships
- Project memberships (direct)
- Simulates `getUserProjects()` query
- Identifies issues and provides recommendations

### 2. Scripts README
**File:** `/scripts/README.md`

**Purpose:** Documentation for all utility scripts in the project.

**Includes:**
- Usage instructions for each script
- Common troubleshooting workflows
- Environment requirements
- Development best practices

### 3. Troubleshooting Guide
**File:** `/GITHUB_USER_TROUBLESHOOTING.md`

**Purpose:** Complete guide for diagnosing and fixing GitHub user access issues.

**Covers:**
- How to read diagnostic output
- Common issues and solutions
- Access control logic
- Database verification steps
- Admin panel workflows
- Testing procedures

### 4. Package.json Scripts
**File:** `/package.json`

**Added Commands:**
```json
{
  "diagnose:user": "tsx scripts/diagnose-github-user.ts",
  "check:github": "tsx scripts/check-github-auth.ts"
}
```

## How The System Works

### Access Control Flow

```
User Signs In
    ↓
GitHub OAuth
    ↓
User Created/Updated in Database
    ├─ githubId: GitHub user ID
    ├─ githubUsername: GitHub username
    ├─ email: GitHub email
    └─ role: admin or member
    ↓
Dashboard Loads
    ↓
getUserProjects() Query
    ↓
    ├─ If admin: Return ALL projects
    └─ If member: Return projects where
        ├─ User's vertical contains project
        └─ OR user is direct project member
    ↓
Display Projects in Dashboard
```

### Diagnostic Flow

```
Run Script
    ↓
1. Lookup User by Email
    ↓
2. Get Vertical Memberships
    ↓
3. Get Project Memberships
    ↓
4. Simulate getUserProjects Query
    ↓
5. Compare Results
    ↓
6. Identify Issues
    ↓
7. Generate Recommendations
    ↓
Display Report
```

## Quick Reference

### When User Can't See Projects

1. **Run Diagnostic**
   ```bash
   npm run diagnose:user -- user@example.com
   ```

2. **Check Output Sections**
   - User Details: Is GitHub linked?
   - Vertical Memberships: Any verticals?
   - Project Memberships: Any projects?
   - Accessible Projects: What query returns?
   - Analysis: What's the issue?

3. **Apply Fix**
   - No GitHub link → User needs to sign in with GitHub
   - No verticals → Admin adds user to vertical
   - No projects → Admin adds user to projects OR creates projects in vertical

4. **Verify Fix**
   ```bash
   npm run diagnose:user -- user@example.com
   ```

### Access Levels

| User Type | Vertical Member | Project Member | Can See Project? |
|-----------|----------------|----------------|------------------|
| Admin     | N/A            | N/A            | ✅ All projects   |
| Member    | ✅ Yes          | -              | ✅ Yes            |
| Member    | ❌ No           | ✅ Yes          | ✅ Yes            |
| Member    | ❌ No           | ❌ No           | ❌ No             |

### Common Commands

```bash
# Diagnose user access
npm run diagnose:user -- user@example.com

# Check GitHub auth status
npm run check:github

# View database
npm run db:studio

# Reseed database
npm run db:seed:modular
```

## Example Outputs

### Healthy User
```
✅ User found in database
✅ Has Vertical Memberships: Yes
✅ Has Project Memberships: Yes
Total Accessible Projects: 3

💡 User should see 3 project(s) in dashboard
```

### Problem User
```
❌ User found but not GitHub user
❌ No vertical memberships
❌ No project memberships
Total Accessible Projects: 0

⚠️  ISSUES:
1. User does not have GitHub account linked
2. User is not a member of any verticals
3. getUserProjects returns 0 projects

💡 RECOMMENDATIONS:
1. User needs to sign in via GitHub OAuth
2. Admin needs to add user to a vertical
```

## Understanding getUserProjects Query

The query that powers the dashboard:

```typescript
// For admin users
if (isAdmin) {
  return ALL_PROJECTS;
}

// For member users
return projects.where({
  OR: [
    // Condition 1: Via vertical membership
    {
      vertical: {
        users: {
          some: { userId: currentUser.id }
        }
      }
    },
    // Condition 2: Via direct project membership
    {
      members: {
        some: { userId: currentUser.id }
      }
    }
  ]
});
```

This means a member can see a project if:
- They belong to the project's vertical, OR
- They are directly added to the project

## Troubleshooting Checklist

### User Reports: "I can't see any projects"

- [ ] **Step 1:** Run diagnostic script
- [ ] **Step 2:** Verify user exists
- [ ] **Step 3:** Check GitHub is linked
- [ ] **Step 4:** Check vertical memberships
- [ ] **Step 5:** Check project memberships
- [ ] **Step 6:** Verify accessible projects count
- [ ] **Step 7:** Apply recommended fixes
- [ ] **Step 8:** Re-run diagnostic
- [ ] **Step 9:** User refreshes dashboard
- [ ] **Step 10:** Confirm projects appear

### Admin Reports: "Can't add user to vertical/project"

- [ ] Verify user exists in database
- [ ] Check user email is correct
- [ ] Verify admin permissions
- [ ] Check database connection
- [ ] Review server logs for errors
- [ ] Try database GUI (Prisma Studio)

## Database Tables

### Key Tables for Access Control

1. **users**
   - Stores user accounts
   - Fields: id, email, role, githubId, githubUsername

2. **verticals**
   - Stores vertical/department groups
   - Fields: id, name

3. **vertical_users**
   - Junction table: users ↔ verticals
   - Fields: id, userId, verticalId

4. **projects**
   - Stores projects
   - Fields: id, name, verticalId

5. **project_members**
   - Junction table: users ↔ projects
   - Fields: id, userId, projectId

### Relationships

```
User ─────┐
          ├─→ VerticalUser ←─→ Vertical ←─→ Project
          │
          └─→ ProjectMember ←─→ Project
```

A user accesses a project via:
- Path 1: User → VerticalUser → Vertical → Project (indirect)
- Path 2: User → ProjectMember → Project (direct)

## Performance Considerations

### Caching
- User projects: 30 second cache
- Project details: 30 second cache
- Membership changes: Invalidate cache immediately

### Revalidation
When membership changes:
```typescript
revalidatePath("/"); // Dashboard
revalidatePath("/admin/projects"); // Admin panel
revalidatePath(`/projects/${projectId}`); // Project page
```

## Security

### Authorization Checks
Every server action verifies:
1. User is authenticated (has session)
2. User has correct role (admin/member)
3. User has access to resource (vertical/project membership)

### Admin Operations
Only admins can:
- Create verticals
- Create projects
- Add/remove vertical members
- Add/remove project members
- Activate sprints
- Use AI generation features

## Future Enhancements

Potential improvements to the diagnostic system:

1. **Web UI Version**
   - Admin panel page: `/admin/diagnostics`
   - Search users and view diagnostic report
   - Quick-fix buttons for common issues

2. **Automated Healing**
   - Script option to auto-fix common issues
   - `--fix` flag to add user to default vertical

3. **Batch Diagnostics**
   - Check all users at once
   - Generate report of users with access issues

4. **Monitoring**
   - Periodic checks for orphaned users
   - Alert admins of configuration issues

## Files Created

```
/scripts/
├── diagnose-github-user.ts          ← Main diagnostic script
└── README.md                          ← Scripts documentation

/
├── GITHUB_USER_TROUBLESHOOTING.md    ← User guide
├── DIAGNOSTIC_SYSTEM_SUMMARY.md      ← This file
└── package.json                       ← Added npm scripts
```

## Related Documentation

- **CLAUDE.md** - Architecture and development guidelines
- **MEMBER_MANAGEMENT_ARCHITECTURE.md** - Detailed access control
- **MEMBER_MANAGEMENT_FIX_GUIDE.md** - Fixing membership issues
- **README.md** - Project overview and setup

## Testing The System

### Test Case 1: New GitHub User
```bash
# User signs in via GitHub OAuth
# Run diagnostic
npm run diagnose:user -- newuser@github.com

# Expected: User found, no memberships
# Action: Add to vertical
# Verify: Re-run diagnostic, should show accessible projects
```

### Test Case 2: Existing User, No Access
```bash
# User exists but can't see projects
npm run diagnose:user -- member@nexus.com

# Check: Vertical memberships, project memberships
# Action: Add to appropriate vertical or projects
# Verify: Projects appear in getUserProjects result
```

### Test Case 3: Admin User
```bash
# Admin should see everything
npm run diagnose:user -- admin@nexus.com

# Expected: Total accessible projects = all projects in DB
# If not: Check role is actually 'admin'
```

## Support Workflow

When helping a user who can't see projects:

1. **Gather Info**
   - User's email
   - What they expect to see
   - What they actually see

2. **Run Diagnostic**
   ```bash
   npm run diagnose:user -- user@example.com
   ```

3. **Identify Issue**
   - Read "ISSUES FOUND" section
   - Review "RECOMMENDATIONS"

4. **Apply Fix**
   - Use admin panel to add memberships
   - Or run appropriate setup script

5. **Verify**
   - Re-run diagnostic
   - Ask user to refresh
   - Confirm projects appear

6. **Document**
   - Note what the issue was
   - Record the solution
   - Update docs if new pattern found

## Success Metrics

The diagnostic system is working if:

- Admins can identify access issues in < 1 minute
- Issues can be fixed in < 5 minutes
- No need to manually inspect database
- Clear, actionable recommendations
- 90%+ of issues resolved with recommended fixes

---

**Status:** ✅ Production Ready
**Created:** February 16, 2026
**Last Updated:** February 16, 2026

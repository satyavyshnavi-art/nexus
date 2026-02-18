# GitHub User Troubleshooting Guide

This guide helps diagnose and fix issues when GitHub OAuth users cannot see projects in their dashboard.

## Quick Diagnosis

Run the diagnostic script with the user's email:

```bash
npm run diagnose:user -- user@example.com
```

Or using npx:

```bash
npx tsx scripts/diagnose-github-user.ts user@example.com
```

## Understanding the Output

The diagnostic report provides five key sections:

### 1. User Details
Shows the user's basic information and GitHub connection status.

**Key fields:**
- `GitHub ID`: Must be set for OAuth users
- `GitHub Username`: Should match their GitHub account
- `Role`: `admin` or `member`

### 2. Vertical Memberships
Lists all verticals the user belongs to.

**Why this matters:**
- Users in a vertical can see ALL projects in that vertical
- This is the primary way to grant access to multiple projects

### 3. Project Memberships (Direct)
Lists projects where the user is explicitly added as a member.

**Why this matters:**
- Direct memberships override vertical access
- Useful for fine-grained access control

### 4. Accessible Projects
Shows what `getUserProjects()` returns - this is what appears in the dashboard.

**This is the most important section:**
- If this is empty, the user will see no projects
- Combines both vertical and direct project memberships

### 5. Analysis
Provides automatic issue detection and recommendations.

## Common Issues and Solutions

### Issue: User Not Found

**Symptom:**
```
❌ User not found in database
```

**Cause:**
User has not signed in via GitHub OAuth yet.

**Solution:**
1. User needs to visit the application
2. Click "Sign in with GitHub"
3. Authorize the Nexus application
4. Run diagnostic again

---

### Issue: GitHub Not Linked

**Symptom:**
```
GitHub ID:       ❌ NOT LINKED
GitHub Username: ❌ NOT LINKED
```

**Cause:**
User created account with email/password instead of GitHub OAuth.

**Solution:**
1. User needs to log out
2. Sign in using "Sign in with GitHub" button
3. GitHub will link to existing account if emails match

---

### Issue: No Vertical Memberships

**Symptom:**
```
❌ No vertical memberships
Total Accessible Projects: 0
```

**Cause:**
User exists but hasn't been added to any verticals.

**Solution:**

#### Option A: Automatic Fix (RECOMMENDED)
Run the automatic fix script to assign all users without verticals to a "Default" vertical:

```bash
npm run fix:github-users
```

This will:
- Find all users without vertical assignments
- Create a "Default" vertical if needed
- Automatically assign all orphaned users to the Default vertical
- Show which projects are now accessible

**Note:** New GitHub OAuth users will now automatically be assigned to a vertical when they sign in, so this issue won't occur for future users.

#### Option B: Add to Vertical Manually
Gives access to all projects in that vertical.

1. Admin logs into Nexus
2. Navigate to `/admin/members`
3. Find the user in the list
4. Click "Manage Verticals"
5. Add user to appropriate vertical(s)

#### Option C: Add to Projects Directly
Gives access to specific projects only.

1. Admin navigates to project page
2. Go to project settings
3. Add user as project member

---

### Issue: No Project Memberships (but has verticals)

**Symptom:**
```
✅ Has Vertical Memberships: Yes
Total Accessible Projects: 0
```

**Cause:**
User is in verticals, but those verticals have no projects yet.

**Solution:**
1. Create projects in the user's verticals
2. Or add user to different verticals that have projects

**Check existing projects:**
```bash
# Connect to database
npx prisma studio

# Or use admin panel
# Visit: /admin/projects
```

---

### Issue: Projects Exist but User Can't See Them

**Symptom:**
```
✅ Has Vertical Memberships: Yes
Total Accessible Projects: 0
```

User's verticals don't match project verticals.

**Solution:**
Either:
- Add user to vertical that contains the projects
- Add user directly to specific projects
- Move projects to user's vertical (admin only)

---

### Issue: Admin User Can't See All Projects

**Symptom:**
Admin user should see all projects but doesn't.

**Cause:**
This shouldn't happen - admins bypass access checks.

**Debug steps:**
1. Verify role is actually `admin`:
   ```bash
   npm run diagnose:user -- admin@nexus.com
   ```

2. Check if `getUserProjects` query is working:
   - Script shows what the query returns
   - Compare with database contents

3. Check cache:
   - Projects are cached for 30 seconds
   - Try waiting and refreshing

---

## Access Control Logic

Nexus uses a two-tier access model:

### For Admin Users
```typescript
// Admins see ALL projects
if (user.role === 'admin') {
  return ALL_PROJECTS;
}
```

### For Member Users
```typescript
// Members see projects where:
if (user.role === 'member') {
  return projects where (
    // 1. Their vertical contains the project
    project.vertical.users.includes(user)
    OR
    // 2. They're directly added as member
    project.members.includes(user)
  );
}
```

## Diagnostic Script Features

The script performs these checks:

1. **User Lookup**: Finds user by email
2. **Vertical Check**: Lists all vertical memberships
3. **Project Check**: Lists direct project memberships
4. **Query Simulation**: Runs the exact same query as the dashboard
5. **Analysis**: Compares expected vs actual results

### Example Output: Working User

```
👤 USER DETAILS
ID:              abc-123-def
Email:           user@example.com
Name:            John Doe
Role:            member
GitHub ID:       ✅ 12345678
GitHub Username: ✅ johndoe

🏢 VERTICAL MEMBERSHIPS
1. Product Engineering
   ID: vertical-123
   Joined: 2026-02-12

📁 PROJECT MEMBERSHIPS (Direct)
1. Customer Portal Module
   Vertical: Product Engineering
   ID: project-456
   Joined: 2026-02-12

🎯 ACCESSIBLE PROJECTS
1. Customer Portal Module
   Stats: 1 sprint(s), 5 member(s)
2. Payment Gateway Module
   Stats: 1 sprint(s), 6 member(s)

📊 ANALYSIS
Is GitHub User:              ✅ Yes
Has Vertical Memberships:    ✅ Yes
Has Project Memberships:     ✅ Yes
Total Accessible Projects:   2

💡 RECOMMENDATIONS
User should see 2 project(s) in dashboard
```

### Example Output: Problem User

```
👤 USER DETAILS
ID:              xyz-789-abc
Email:           newuser@example.com
Name:            Jane Smith
Role:            member
GitHub ID:       ✅ 87654321
GitHub Username: ✅ janesmith

🏢 VERTICAL MEMBERSHIPS
❌ No vertical memberships

📁 PROJECT MEMBERSHIPS (Direct)
⚠️  No direct project memberships

🎯 ACCESSIBLE PROJECTS
❌ No accessible projects (user will see empty dashboard)

⚠️  ISSUES FOUND
1. User is not a member of any verticals
2. User is not a member of any projects
3. getUserProjects returns 0 projects for this user

💡 RECOMMENDATIONS
1. Admin needs to add user to a vertical using the admin panel
2. Admin needs to add user to projects, OR
3. Add user to a vertical (they will see all projects in that vertical)
```

## Database Verification

Check the database directly using Prisma Studio:

```bash
npm run db:studio
```

### Tables to Check

1. **users**: Verify user exists and has `githubId`
2. **vertical_users**: Check vertical memberships
3. **project_members**: Check project memberships
4. **projects**: See all available projects and their verticals

### SQL Queries (Advanced)

Check user's accessible projects manually:

```sql
-- Find user
SELECT id, email, name, role, github_id, github_username
FROM users
WHERE email = 'user@example.com';

-- Find vertical memberships
SELECT v.name, vu.created_at
FROM vertical_users vu
JOIN verticals v ON v.id = vu.vertical_id
WHERE vu.user_id = 'user-id-here';

-- Find project memberships
SELECT p.name, v.name as vertical, pm.created_at
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
JOIN verticals v ON v.id = p.vertical_id
WHERE pm.user_id = 'user-id-here';

-- Find projects user can access (via vertical)
SELECT p.name, v.name as vertical
FROM projects p
JOIN verticals v ON v.id = p.vertical_id
JOIN vertical_users vu ON vu.vertical_id = v.id
WHERE vu.user_id = 'user-id-here';
```

## Admin Panel Workflow

### Adding User to Vertical

1. Sign in as admin
2. Navigate to `/admin/members`
3. Locate user in the table
4. Click "Manage Verticals" button
5. Select verticals to add user to
6. Click "Save Changes"
7. User will immediately see all projects in those verticals

### Adding User to Specific Project

1. Sign in as admin
2. Navigate to `/admin/projects`
3. Click on the project
4. Click "Manage Members"
5. Select user from dropdown
6. Click "Add Member"
7. User will immediately see this project

## Testing Access

After making changes:

1. Run diagnostic again:
   ```bash
   npm run diagnose:user -- user@example.com
   ```

2. User should:
   - Log out and log back in (clears session cache)
   - Or wait 30 seconds (cache revalidation)
   - Refresh the dashboard

3. Verify projects appear in:
   - Dashboard (`/`)
   - Projects list
   - Sidebar navigation

## Cache Behavior

Nexus uses caching for performance:

- **User projects**: Cached for 30 seconds
- **Project details**: Cached for 30 seconds
- **Cache tags**: Invalidated on membership changes

If changes don't appear immediately:
1. Wait 30 seconds
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Or restart the Next.js dev server

## Support Checklist

When a user reports "I can't see any projects":

- [ ] Run diagnostic script with their email
- [ ] Verify GitHub ID is set
- [ ] Check vertical memberships
- [ ] Check project memberships
- [ ] Verify projects exist in their verticals
- [ ] Test getUserProjects query result
- [ ] Review issues and recommendations
- [ ] Apply suggested fixes
- [ ] Re-run diagnostic to confirm
- [ ] Ask user to refresh dashboard

## Additional Tools

### Check GitHub Authentication

Verify admin user has GitHub token for repository features:

```bash
npm run check:github
```

### Reseed Database

Reset to clean test data:

```bash
# Modular projects (recommended)
npm run db:seed:modular

# Comprehensive test data
npm run db:seed
```

### Database GUI

Visual database exploration:

```bash
npm run db:studio
```

## Related Documentation

- `/scripts/README.md` - All available diagnostic scripts
- `/CLAUDE.md` - Architecture and access control rules
- `/MEMBER_MANAGEMENT_ARCHITECTURE.md` - Detailed access control docs
- `/README.md` - General project setup

## Getting Help

If diagnostic script doesn't solve the issue:

1. Check Next.js server logs for errors
2. Inspect browser console for client errors
3. Verify database connection is working
4. Check environment variables are set
5. Review recent code changes
6. Check GitHub Issues for known bugs

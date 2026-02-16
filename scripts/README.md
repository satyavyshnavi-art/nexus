# Nexus Scripts

Utility scripts for managing and diagnosing the Nexus application.

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run diagnose:projects <email>` | Check why a specific user can't see projects |
| `npm run diagnose:visibility [email]` | Generate full visibility report |
| `npm run test:cache` | Test cache revalidation behavior |
| `npm run test:new-user` | Simulate complete new user flow |
| `npm run simulate:add-member <project> <email>` | Simulate adding user to project |

See `/Users/vyshanvi/nexus/DIAGNOSTICS.md` for comprehensive troubleshooting guide.

---

## Available Scripts

### Project Visibility Diagnostics (NEW)

#### `diagnose-user-projects.ts`
Comprehensive diagnostic tool to identify why a user can't see their assigned projects.

**Usage:**
```bash
npx tsx scripts/diagnose-github-user.ts <email>
```

**Example:**
```bash
npx tsx scripts/diagnose-github-user.ts vyshanvi.art@gmail.com
```

**What it checks:**
- User exists in database
- GitHub account is linked (githubId, githubUsername)
- User role (admin/member)
- Vertical memberships
- Project memberships (direct)
- What `getUserProjects()` returns for the user
- Issues and recommendations

**Output:**
```
👤 USER DETAILS
- ID, Email, Name, Role
- GitHub ID & Username
- Account creation date

🏢 VERTICAL MEMBERSHIPS
- Lists all verticals the user belongs to
- Join dates

📁 PROJECT MEMBERSHIPS (Direct)
- Direct project memberships
- Associated verticals

🎯 ACCESSIBLE PROJECTS
- All projects the user can access
- Simulates the actual getUserProjects query
- Shows what appears in the dashboard

📊 ANALYSIS
- Identifies issues
- Provides specific recommendations
```

#### `check-github-auth.ts`
Quick check for GitHub authentication status of admin user.

**Usage:**
```bash
npx tsx scripts/check-github-auth.ts
```

**Use case:** Verify admin has GitHub OAuth token before linking repositories.

#### `full-project-visibility-report.ts`
Generate comprehensive project visibility report for all users or a specific user.

**Usage:**
```bash
npm run diagnose:visibility                          # All users
npm run diagnose:visibility sarah.frontend@nexus.com # Specific user
```

**What it shows:**
- Vertical assignments per user
- Direct project memberships
- Visible projects (via getUserProjects query)
- Access type (via vertical or direct member)
- Summary table with statistics
- Analysis and recommendations

#### `test-cache-revalidation.ts`
Test cache revalidation behavior after project member changes.

**Usage:**
```bash
npm run test:cache
```

**What it checks:**
- Current project memberships
- getUserProjects() query results
- Cache keys that should be revalidated
- Recent membership changes timing
- Troubleshooting checklist for cache issues

#### `test-new-user-flow.ts`
Simulate complete new user onboarding flow from creation to project access.

**Usage:**
```bash
npm run test:new-user
```

**What it does:**
1. Creates a test user
2. Checks visibility (should be 0 projects)
3. Assigns user to vertical
4. Checks visibility (should see vertical's projects)
5. Adds user as direct project member
6. Verifies final visibility
7. Cleans up test user

#### `simulate-add-member.ts`
Simulate adding a user to a project without using the UI.

**Usage:**
```bash
npm run simulate:add-member "Payment Gateway Module" mike.backend@nexus.com
```

**What it shows:**
- User and project verification
- Vertical membership check
- Before/after project visibility comparison
- Cache revalidation paths
- Step-by-step analysis

#### `diagnose-github-user.ts`
Comprehensive diagnostic tool to troubleshoot why a user (especially GitHub OAuth users) may not see projects in their dashboard.

### Setup Scripts

#### `seed.ts`
Basic database seeding with minimal test data.

**Usage:**
```bash
npm run db:seed
```

#### `seed-comprehensive.ts`
Comprehensive seeding with realistic test data.

**Usage:**
```bash
npx tsx scripts/seed-comprehensive.ts
```

#### `seed-modular.ts`
Seeds database with modular project structure (recommended for testing).

**Usage:**
```bash
npm run db:seed:modular
```

**Creates:**
- 11 users (1 admin + 10 team members)
- 2 verticals (Product Engineering, Mobile Engineering)
- 4 modular projects with active sprints
- Multiple tasks per project

### Admin Scripts

#### `fix-github-users-vertical.ts`
Fixes existing GitHub OAuth users who don't have vertical assignments by automatically assigning them to a "Default" vertical.

**Usage:**
```bash
npm run fix:github-users
```

**What it does:**
- Finds all users without any vertical memberships
- Creates a "Default" vertical if it doesn't exist
- Assigns all orphaned users to the Default vertical
- Reports which projects are now accessible to these users

**Use case:** Run this after deploying the GitHub OAuth vertical assignment fix to retroactively fix existing users.

#### `add-admin-to-project.ts`
Adds the admin user to a specific project.

**Usage:**
```bash
npx tsx scripts/add-admin-to-project.ts
```

**Interactive:** Prompts for project selection.

#### `create-github-project.ts`
Creates a new project linked to a GitHub repository.

**Usage:**
```bash
npx tsx scripts/create-github-project.ts
```

**Interactive:** Prompts for project details and GitHub repository information.

## Common Troubleshooting Workflows

### User Can't See Projects (Primary Issue)

**Quick Diagnosis:**
```bash
npm run diagnose:projects user@example.com
```

**Common Causes:**

1. **User not assigned to any verticals**
   ```
   ❌ User is NOT assigned to any verticals
   ```
   **Fix:** Admin assigns user to vertical via `/admin/verticals`

2. **Vertical has no projects**
   ```
   ✅ User is assigned to 1 vertical(s)
   ❌ Query returns 0 projects
   ```
   **Fix:** Create projects in the vertical OR assign user to different vertical

3. **Cache not revalidated**
   ```
   ✅ Query returns 3 project(s)
   But dashboard shows "No Projects"
   ```
   **Fix:**
   - Hard refresh browser (Cmd+Shift+R)
   - Clear Next.js cache: `rm -rf .next && npm run dev`
   - Wait 30 seconds for cache to expire

**Full Analysis:**
```bash
npm run diagnose:visibility
```

### GitHub OAuth User Can't See Projects

1. Run GitHub-specific diagnostic:
   ```bash
   npx tsx scripts/diagnose-github-user.ts user@example.com
   ```

2. Check output for issues:
   - **Not a GitHub user?** User needs to sign in via GitHub OAuth
   - **No vertical memberships?** Run the fix script first:
     ```bash
     npm run fix:github-users
     ```
   - **No project memberships?** Either:
     - Add user to verticals (they'll see all projects in that vertical)
     - Add user directly to projects

3. Fix using admin panel:
   - Navigate to `/admin/verticals`
   - Add user to appropriate verticals
   - User will see ALL projects in that vertical

### GitHub Repository Linking Issues

1. Check GitHub auth:
   ```bash
   npx tsx scripts/check-github-auth.ts
   ```

2. If token missing:
   - Log out of Nexus
   - Sign in with GitHub
   - Authorize the application
   - Try linking repository again

3. Create GitHub-linked project manually:
   ```bash
   npx tsx scripts/create-github-project.ts
   ```

## Environment Requirements

All scripts require:
- `DATABASE_URL` environment variable set
- Prisma Client generated (`npx prisma generate`)
- tsx installed (`npm install -g tsx` or use via npx)

## Development

Scripts use:
- TypeScript
- Prisma Client
- Direct database access (bypasses Next.js)

**Best practices:**
- Always disconnect Prisma client after script execution
- Include error handling
- Provide clear console output
- Use descriptive variable names

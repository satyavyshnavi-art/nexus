# Nexus Scripts

Utility scripts for managing and diagnosing the Nexus application.

## Available Scripts

### Diagnostic Scripts

#### `diagnose-github-user.ts`
Comprehensive diagnostic tool to troubleshoot why a user (especially GitHub OAuth users) may not see projects in their dashboard.

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

### User Can't See Projects

1. Run diagnostic:
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
   - Navigate to `/admin/members`
   - Add user to appropriate verticals
   - Navigate to project settings
   - Add user to specific projects if needed

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

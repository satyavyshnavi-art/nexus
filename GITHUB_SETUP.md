# GitHub Integration Setup Guide

This guide will help you set up GitHub OAuth and task syncing for Nexus.

## Overview

Nexus supports GitHub integration with the following features:
- **GitHub OAuth Sign-in**: Users can sign in with their GitHub account
- **Repository Linking**: Admins can link projects to GitHub repositories
- **Task Sync**: Manually push Nexus tasks to GitHub as issues (one-way sync)

## Prerequisites

- A GitHub account
- Admin access to create a GitHub OAuth app
- Access to your Nexus environment variables

---

## Step 1: Create a GitHub OAuth App

1. **Go to GitHub Settings**
   - Navigate to: https://github.com/settings/developers
   - Click **OAuth Apps** → **New OAuth App**

2. **Configure OAuth App**
   - **Application name**: `Nexus Project Management`
   - **Homepage URL**: Your Nexus URL (e.g., `https://nexus-rosy-nine.vercel.app` or `http://localhost:3000`)
   - **Application description**: (Optional) "Task management with GitHub integration"
   - **Authorization callback URL**: `https://your-nexus-domain.com/api/auth/callback/github`
     - For production: `https://nexus-rosy-nine.vercel.app/api/auth/callback/github`
     - For local dev: `http://localhost:3000/api/auth/callback/github`

3. **Register Application**
   - Click **Register application**
   - You'll be redirected to your app's settings page

4. **Get Credentials**
   - Copy the **Client ID**
   - Click **Generate a new client secret**
   - Copy the **Client Secret** (save it immediately - you won't see it again!)

---

## Step 2: Generate Encryption Key

The GitHub access tokens need to be encrypted before storage. Generate a secure encryption key:

```bash
openssl rand -base64 32
```

Copy the output - this is your `GITHUB_TOKEN_ENCRYPTION_KEY`.

---

## Step 3: Update Environment Variables

Add the following to your `.env` file:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"
GITHUB_TOKEN_ENCRYPTION_KEY="your_base64_encryption_key_here"
```

### For Vercel Deployment

If deploying to Vercel, add these as environment variables in your Vercel project settings:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_TOKEN_ENCRYPTION_KEY`
4. Redeploy your application

---

## Step 4: Run Database Migration

The GitHub integration requires new database fields. Run the migration:

```bash
# For local development
npx prisma migrate dev

# For production (automatic via postinstall script)
npx prisma migrate deploy
```

---

## Step 5: Test the Integration

### Test GitHub Sign-in

1. **Sign out** if currently logged in
2. Go to the **login page**
3. Click **"Sign in with GitHub"**
4. Authorize the Nexus OAuth app
5. You should be redirected back to Nexus dashboard

### Test Repository Linking (Admin Only)

1. **Sign in as admin** with GitHub account
2. Go to a **project page**
3. Click **"Link GitHub Repository"** (if admin)
4. Enter repository owner (e.g., `octocat`) and name (e.g., `hello-world`)
5. Click **"Link Repository"**
6. Verify success message and repository link display

### Test Task Syncing

1. Go to a **project with linked repository**
2. Open the **Kanban board**
3. Find or create a task
4. Click **"Push to GitHub"** on the task card
5. Verify:
   - Success toast appears
   - Task shows "Issue #X" badge
   - Clicking badge opens GitHub issue in new tab
6. Go to GitHub repository → Issues → Verify issue created

---

## Features

### GitHub OAuth Sign-in

- Users can sign in with GitHub or email/password
- GitHub users auto-created if email doesn't exist
- Existing users can link GitHub by signing in with GitHub using same email
- Tokens encrypted with AES-256-GCM before database storage

### Repository Linking

- **Admin only** can link/unlink repositories
- One repository per project
- Validates access before linking
- Shows linked repository info on project page

### Task Sync

- **Manual sync** via "Push to GitHub" button on tasks
- Creates GitHub issue with:
  - Title from task title
  - Description from task description
  - Labels for priority, type, and status
  - Assignee (if they have GitHub account)
  - Story points in description
- Update existing issues when task changes
- Closes issues when task status = "done"
- Admin can batch sync all unsynced tasks
- Sync logs tracked for audit

---

## Troubleshooting

### "GitHub account not connected" Error

**Solution**: Sign out and sign in with GitHub. The GitHub OAuth flow stores encrypted tokens needed for syncing.

### "Repository not found or access denied" Error

**Possible causes**:
1. Repository doesn't exist
2. Repository is private and you don't have access
3. Wrong owner/name format

**Solution**: Verify the repository exists and you have access. For `github.com/owner/repo`, enter "owner" and "repo" separately.

### "Failed to create GitHub issue" Error

**Possible causes**:
1. Insufficient permissions on repository
2. Invalid assignee (they don't have repo access)
3. GitHub API rate limit exceeded

**Solution**:
- Ensure you have **write access** to the repository
- Verify assignee has access to repository
- Check GitHub API rate limits (5000 requests/hour)

### Migration Fails with "column already exists"

**Solution**: The migration has already been applied. Run:
```bash
npx prisma generate
```

---

## Security Notes

### Token Encryption

- All GitHub access tokens encrypted with AES-256-GCM
- Encryption key stored in environment variable (never committed)
- Tokens never exposed in API responses or error messages

### Authorization

- **Repository linking**: Admin only
- **Task sync**: Project members only (or admin)
- **Batch sync**: Admin only
- Always verifies GitHub account connection before operations

### Input Validation

- Repository owner/name validated with Zod schemas
- SQL injection prevented via Prisma ORM
- XSS prevention handled by React

---

## Rate Limits

GitHub API has the following rate limits:
- **Authenticated requests**: 5,000 per hour
- **Batch sync**: 1-second delay between tasks to avoid rate limiting

If you hit rate limits:
- Wait for the rate limit to reset (shown in error message)
- Reduce batch sync frequency
- Sync tasks individually instead of batch

---

## Sync Logs

All sync operations are logged to the `github_sync_logs` table:
- Action type (create/update/close)
- Status (success/failed)
- Error messages (if failed)
- Timestamp
- User who triggered sync

View logs in Prisma Studio:
```bash
npx prisma studio
```

---

## Uninstalling GitHub Integration

If you want to remove GitHub integration:

1. **Unlink all repositories**
   - Go to each project
   - Click "Unlink" (admin only)

2. **Remove OAuth app**
   - Go to GitHub Settings → OAuth Apps
   - Delete the Nexus OAuth app

3. **Remove environment variables**
   - Remove `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_TOKEN_ENCRYPTION_KEY`

4. **(Optional) Revert database migration**
   ```bash
   # This will remove GitHub fields from database
   npx prisma migrate dev --name remove_github_integration
   ```

Note: Sync logs and issue links will be preserved for audit purposes.

---

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/satyavyshnavi-art/nexus/issues)
- Review the implementation in `/lib/github/` and `/server/actions/github-*.ts`
- Consult the PRD in `/prd.md` for feature specifications

---

## Technical Architecture

### Files Added

- `/lib/crypto/encryption.ts` - AES-256-GCM token encryption
- `/lib/github/client.ts` - Octokit wrapper with auth
- `/lib/github/sync.ts` - Issue sync logic
- `/server/actions/github-link.ts` - Repository linking
- `/server/actions/github-sync.ts` - Task sync actions
- `/components/projects/github-link-dialog.tsx` - Link repo UI
- `/components/projects/github-linked-status.tsx` - Show linked repo
- `/components/tasks/github-sync-button.tsx` - Sync button

### Database Schema Changes

**User model**:
- `githubId` - GitHub user ID (unique)
- `githubUsername` - GitHub username
- `githubAccessToken` - Encrypted access token
- `githubRefreshToken` - Encrypted refresh token
- `githubTokenExpiry` - Token expiration date

**Project model**:
- `githubRepoOwner` - Repository owner
- `githubRepoName` - Repository name
- `githubRepoId` - GitHub numeric repo ID
- `githubLinkedBy` - User who linked (foreign key)
- `githubLinkedAt` - Link timestamp

**Task model**:
- `githubIssueNumber` - Issue number (#123)
- `githubIssueId` - GitHub global issue ID
- `githubSyncedAt` - Last sync timestamp
- `githubUrl` - Direct link to issue

**GitHubSyncLog model** (new):
- Tracks all sync operations for audit
- Records successes and failures
- Links to task and project

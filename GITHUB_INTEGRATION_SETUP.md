# GitHub Integration Setup Guide

## 🎯 What Was Fixed

The GitHub repository linking feature was not working due to missing environment variables. The following has been set up:

### ✅ Completed
1. **Encryption Key Generated**: `GITHUB_TOKEN_ENCRYPTION_KEY` added to `.env`
2. **Environment Variables Added**: Placeholders for GitHub OAuth credentials in `.env`
3. **Code Review**: All integration code is properly implemented

### ⏳ Pending (Requires Your Action)

You need to create a GitHub OAuth App and add the credentials to your `.env` file.

---

## 📋 Setup Instructions

### Step 1: Create GitHub OAuth App

1. Go to **GitHub Settings**: https://github.com/settings/developers
2. Click **"New OAuth App"** (or "OAuth Apps" → "New OAuth App")
3. Fill in the application details:

   **For Local Development:**
   - **Application name**: `Nexus Project Manager (Dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

   **For Production (Vercel):**
   - **Application name**: `Nexus Project Manager`
   - **Homepage URL**: `https://nexus-rosy-nine.vercel.app`
   - **Authorization callback URL**: `https://nexus-rosy-nine.vercel.app/api/auth/callback/github`

4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy the **Client Secret**

### Step 2: Update Environment Variables

1. Open `/Users/vyshanvi/nexus/.env`
2. Update these lines with your GitHub OAuth credentials:

```bash
GITHUB_CLIENT_ID="your_client_id_here"
GITHUB_CLIENT_SECRET="your_client_secret_here"
```

3. Save the file

### Step 3: Add to Vercel (Production)

1. Go to your Vercel project: https://vercel.com/satyavyshnavi-art/nexus
2. Go to **Settings** → **Environment Variables**
3. Add these three variables:
   - `GITHUB_CLIENT_ID` → your_client_id
   - `GITHUB_CLIENT_SECRET` → your_client_secret
   - `GITHUB_TOKEN_ENCRYPTION_KEY` → `2hbGUGfQz8/2PMetxcO9IYtQIPmZiZIUidGIRIV8J+s=`

4. **Redeploy** your application for changes to take effect

### Step 4: Restart Local Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## 🔐 How to Link Repositories

### Prerequisites
You **must** sign in with GitHub to link repositories. Here's why:

The repository linking feature requires a GitHub access token to:
- Verify you have access to the repository
- Fetch repository information
- (Future) Sync tasks as GitHub issues

### Workflow for Admin Users

1. **First Time Setup:**
   - Log out of Nexus
   - Click "Sign in with GitHub" on the login page
   - Authorize the Nexus app
   - This stores your GitHub access token securely (encrypted)

2. **Linking a Repository:**
   - Navigate to any project page
   - Click the "Overview" tab
   - In the "GitHub Integration" section, click **"Link GitHub Repository"**
   - Enter the repository owner and name (e.g., `octocat` and `hello-world`)
   - Click "Link Repository"

3. **Verify Link:**
   - The repository will show as linked
   - You'll see a badge with the repository name
   - A link to view it on GitHub

### For Existing Users (Already Logged in with Email)

If you're already logged in with email/password:
1. **Log out**
2. **Sign in with GitHub** instead
3. If your email matches, your account will be linked automatically
4. You can now link repositories

---

## 🏗️ Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Link GitHub Repository"                        │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Server Action: linkGitHubRepository()                       │
│  1. Check if user is admin                                  │
│  2. Verify user has GitHub token stored                     │
│  3. Decrypt token                                            │
│  4. Use Octokit to verify repo access                       │
│  5. Store repo info in database                             │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Project updated with GitHub repo metadata                   │
│  - githubRepoOwner                                          │
│  - githubRepoName                                           │
│  - githubRepoId                                             │
│  - githubLinkedBy                                           │
│  - githubLinkedAt                                           │
└─────────────────────────────────────────────────────────────┘
```

### Security Features

1. **Encrypted Token Storage**: GitHub access tokens are encrypted using AES-256-GCM before storage
2. **Admin Only**: Only admins can link/unlink repositories
3. **Access Verification**: System verifies you have access to the repo before linking
4. **Secure Scopes**: OAuth only requests minimal permissions (`read:user user:email`)

---

## 🧪 Testing the Integration

### Test Checklist

1. **Environment Setup**
   - [ ] GitHub OAuth credentials added to `.env`
   - [ ] Dev server restarted
   - [ ] Can see "Sign in with GitHub" button on login page

2. **GitHub Authentication**
   - [ ] Sign in with GitHub works
   - [ ] User account gets GitHub token stored
   - [ ] Can see GitHub username in profile (if implemented)

3. **Repository Linking**
   - [ ] "Link GitHub Repository" button appears for admins
   - [ ] Can successfully link a public repository
   - [ ] Can successfully link a private repository (that you have access to)
   - [ ] Error shown for non-existent repositories
   - [ ] Error shown for repositories you don't have access to

4. **Repository Unlinking**
   - [ ] Can unlink a repository
   - [ ] Repository info cleared from database
   - [ ] Can re-link a different repository

---

## 🐛 Troubleshooting

### Error: "GITHUB_TOKEN_ENCRYPTION_KEY environment variable is not set"
**Solution**: Make sure you've added the encryption key to `.env` and restarted the server.

### Error: "GitHub account not connected"
**Solution**: Log out and sign in with GitHub instead of email/password.

### Error: "Repository not found or you don't have access"
**Causes**:
1. Repository name is incorrect
2. Repository is private and you don't have access
3. Organization repository and you're not a member

**Solution**: Verify the repository exists and you have access on GitHub.

### Error: "GitHub API rate limit exceeded"
**Solution**: Wait for the rate limit to reset (usually 1 hour). Consider using a different GitHub account or upgrading to GitHub Pro.

---

## 🚀 What's Next

Once GitHub integration is set up, you'll be able to:

### Currently Implemented:
- ✅ Link projects to GitHub repositories
- ✅ View linked repository status
- ✅ Unlink repositories

### Future Features (Ready to Build):
- 🔄 Sync tasks as GitHub issues
- 🔄 Auto-update task status from issue status
- 🔄 Bidirectional sync
- 🔄 Sync comments between Nexus and GitHub

---

## 📝 Notes

- The encryption key is generated once and should be kept secure
- Never commit the `.env` file with real credentials to Git
- For production, always use environment variables in Vercel
- GitHub tokens are refreshed automatically (if refresh token is provided)

---

**Status**: ⏳ Waiting for GitHub OAuth credentials
**Last Updated**: February 13, 2026

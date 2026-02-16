# 🚨 URGENT: GitHub OAuth Redirect URI Fix

## The Problem

**Error:** "The redirect_uri is not associated with this application"

**Impact:**
- ❌ Cannot sign in with GitHub
- ❌ Projects not showing for users

---

## Root Cause

Your GitHub OAuth app's callback URL doesn't match what NextAuth is sending.

**What NextAuth sends:**
```
http://localhost:3000/api/auth/callback/github
```

**What GitHub OAuth app expects:**
This is probably set to something different or missing entirely.

---

## IMMEDIATE FIX (5 Minutes)

### Step 1: Update GitHub OAuth App

1. Go to: **https://github.com/settings/developers**

2. Click **"OAuth Apps"** → Find your app (Client ID: `Ov23li9vkx1fBalUkfKR`)

3. Update **"Authorization callback URL"** to:
   ```
   http://localhost:3000/api/auth/callback/github
   ```

4. Click **"Update application"**

### Step 2: Test Immediately

1. Go to http://localhost:3000/login
2. Click "Sign in with GitHub"
3. Should work now! ✅

---

## For Production (After Local Works)

### Create Separate Production OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Name**: Nexus Production
   - **Homepage**: `https://nexus-rosy-nine.vercel.app`
   - **Callback**: `https://nexus-rosy-nine.vercel.app/api/auth/callback/github`
4. Click "Register"
5. Copy Client ID and Secret

### Update Vercel Environment Variables

1. Go to: https://vercel.com/satyavyshnavi-art/nexus/settings/environment-variables

2. Add/Update (for **all environments**):
   ```
   NEXTAUTH_URL=https://nexus-rosy-nine.vercel.app
   GITHUB_CLIENT_ID=<new-production-client-id>
   GITHUB_CLIENT_SECRET=<new-production-client-secret>
   GITHUB_TOKEN_ENCRYPTION_KEY=2hbGUGfQz8/2PMetxcO9IYtQIPmZiZIUidGIRIV8J+s=
   ```

3. **Redeploy** the application

---

## Why Projects Aren't Showing

After fixing GitHub OAuth, projects still might not show because:

### Issue 1: User Not in Any Vertical

**Check this:**
```bash
npm run diagnose:projects <user-email>
```

**If output shows "0 verticals":**

```bash
# Fix it
npm run fix:github-users
```

### Issue 2: Cache Delay (30 seconds)

**Quick fix:** Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Issue 3: No Projects in User's Vertical

**Solution:** Admin must create projects in the user's vertical OR assign user to a different vertical

---

## Quick Test Commands

```bash
# Check specific user
npm run diagnose:projects vyshanvi.art@gmail.com

# Check all users
npm run diagnose:visibility

# Fix users without verticals
npm run fix:github-users
```

---

## Expected Flow After Fix

1. User signs in with GitHub → Success ✅
2. `ensureUserHasVertical()` assigns to "Default" vertical ✅
3. `getUserProjects()` finds projects in "Default" vertical ✅
4. Dashboard shows projects ✅

---

## Still Not Working?

Run full diagnostic:
```bash
cd /Users/vyshanvi/nexus
npm run diagnose:projects <email>
npm run check:github
```

Share the output and I'll help debug!

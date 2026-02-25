# Google Sign-In Setup Guide for Nexus

## Overview

Add "Sign in with Google" to Nexus using NextAuth.js v5 Google OAuth provider. The JWT callback already handles Google provider (`account?.provider === "google"` in `lib/auth/config.ts` line 152), so most of the backend is ready.

---

## Part 1: Google Cloud Console Setup

### 1.1 Create/Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top bar) → **New Project**
3. Name: `Nexus` (or use an existing project)
4. Click **Create**

### 1.2 Enable the Google Identity API

1. Go to **APIs & Services → Library**
2. Search for **"Google Identity"** or **"Google+ API"**
3. Enable it (if not already enabled)

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** (allows any Google account to sign in)
3. Fill in:
   - **App name:** `Nexus by Stanza Soft`
   - **User support email:** your email
   - **App logo:** upload the Stanza Soft logo (optional)
   - **App domain:** `pm.stanzasoft.ai`
   - **Authorized domains:** `stanzasoft.ai`
   - **Developer contact email:** your email
4. Click **Save and Continue**
5. **Scopes:** Add `email`, `profile`, `openid` → Save and Continue
6. **Test users:** Add your email for testing → Save and Continue
7. Click **Back to Dashboard**

### 1.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Nexus Web`
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://pm.stanzasoft.ai
   https://nexus-rosy-nine.vercel.app
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://pm.stanzasoft.ai/api/auth/callback/google
   https://nexus-rosy-nine.vercel.app/api/auth/callback/google
   ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

---

## Part 2: Environment Variables

### 2.1 Local Development (`.env.local`)

Add these to your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### 2.2 Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/vyshnavis-projects-16b15b9f/nexus/settings/environment-variables)
2. Add two environment variables:
   - `GOOGLE_CLIENT_ID` → paste your Client ID
   - `GOOGLE_CLIENT_SECRET` → paste your Client Secret
3. Select **Production** and **Preview** environments
4. Click **Save**

---

## Part 3: Code Changes

### 3.1 Add Google Provider to NextAuth Config

**File:** `lib/auth/config.ts`

Add the import at the top:
```typescript
import Google from "next-auth/providers/google";
```

Add the Google provider in the `providers` array (after GitHub):
```typescript
// Google OAuth provider
Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
}),
```

### 3.2 Handle Google Sign-In in the `signIn` Callback

In the same file (`lib/auth/config.ts`), add a Google handler in the `signIn` callback, after the GitHub block:

```typescript
if (account?.provider === "google") {
  try {
    await db.$transaction(async (tx) => {
      // Check if user exists by email
      let dbUser = user.email
        ? await tx.user.findUnique({ where: { email: user.email } })
        : null;

      if (dbUser) {
        // Update name/avatar if not set
        await tx.user.update({
          where: { id: dbUser.id },
          data: {
            name: dbUser.name || user.name || "Google User",
            avatar: dbUser.avatar || user.image || null,
          },
        });
      } else {
        // Create new user
        const newUser = await tx.user.create({
          data: {
            email: user.email!,
            name: user.name || "Google User",
            avatar: user.image || null,
            role: "member",
          },
        });

        // Assign to Default vertical
        const defaultVertical = await tx.vertical.upsert({
          where: { name: "Default" },
          update: {},
          create: { name: "Default" },
        });
        await tx.verticalUser.create({
          data: { verticalId: defaultVertical.id, userId: newUser.id },
        });
      }
    });
  } catch (error) {
    console.error("Google sign-in error:", error);
    return false;
  }
}
```

### 3.3 Add Google Sign-In Server Action

**File:** `server/actions/auth.ts`

Add this function:
```typescript
export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}
```

### 3.4 Add Google Button to Login Page

**File:** `app/(auth)/login/page.tsx`

Add the import:
```typescript
import { loginUser, loginWithGitHub, loginWithGoogle } from "@/server/actions/auth";
```

Add a handler function inside LoginForm:
```typescript
const handleGoogleSignIn = async () => {
  setError("");
  setLoading(true);
  try {
    await loginWithGoogle();
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      return;
    }
    setError("Google sign-in failed. Please try again.");
    setLoading(false);
  }
};
```

Add the button after the GitHub button:
```tsx
<Button
  type="button"
  variant="outline"
  className="w-full h-12 text-base font-medium"
  onClick={handleGoogleSignIn}
  disabled={loading}
>
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
  Sign in with Google
</Button>
```

### 3.5 Add Google Button to Register Page

**File:** `app/(auth)/register/page.tsx`

Same changes as login — add Google button below the "Create Account" button with an "Or continue with" divider.

---

## Part 4: Testing

### 4.1 Local Testing

```bash
npm run dev
```
1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Select your Google account
4. Verify you're redirected to the dashboard

### 4.2 Check Database

```bash
npx prisma studio
```
Verify the new user was created with:
- Correct email from Google
- Name from Google profile
- Avatar URL from Google profile
- Role: `member`
- Assigned to "Default" vertical

### 4.3 Production Testing

After deploying:
1. Go to `https://pm.stanzasoft.ai/login`
2. Test Google sign-in
3. If you get a "redirect_uri_mismatch" error, double-check the redirect URIs in Google Cloud Console match exactly

---

## Part 5: Publish the OAuth App (Optional)

While in **Testing** mode, only test users you added can sign in. To allow anyone:

1. Go to **APIs & Services → OAuth consent screen**
2. Click **Publish App**
3. Review and confirm

> Note: Google may require verification for apps requesting sensitive scopes. Since we only use `email`, `profile`, `openid`, verification is usually quick or not required.

---

## Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] `GOOGLE_CLIENT_ID` added to `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` added to `.env.local`
- [ ] `GOOGLE_CLIENT_ID` added to Vercel env vars
- [ ] `GOOGLE_CLIENT_SECRET` added to Vercel env vars
- [ ] Google provider added to `lib/auth/config.ts`
- [ ] Google signIn handler added to `signIn` callback
- [ ] `loginWithGoogle` action added to `server/actions/auth.ts`
- [ ] Google button added to login page
- [ ] Google button added to register page
- [ ] Local testing passed
- [ ] Production testing passed
- [ ] OAuth app published (if needed)

---

## Cost

**$0/month** — Google OAuth 2.0 is completely free. No per-user or per-login charges.

---

## Files to Modify

| File | Change |
|------|--------|
| `lib/auth/config.ts` | Add Google provider + signIn callback handler |
| `server/actions/auth.ts` | Add `loginWithGoogle()` action |
| `app/(auth)/login/page.tsx` | Add Google sign-in button |
| `app/(auth)/register/page.tsx` | Add Google sign-in button |
| `.env.local` | Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |

# GitHub OAuth Vertical Assignment Fix

## Problem

GitHub OAuth users were not seeing any projects in their dashboard after signing in. This was because:

1. When a user signs in with GitHub OAuth, a user account is created in the database
2. However, the user was NOT automatically assigned to any vertical
3. The `getUserProjects()` query looks for projects where:
   - User is in a vertical that contains projects, OR
   - User is directly added as a project member
4. Without a vertical assignment, new GitHub users had no projects to see

## Solution

### 1. Automatic Assignment for New Users

**File:** `/lib/auth/helpers.ts`

Created a helper function `ensureUserHasVertical()` that:
- Checks if a user has any vertical memberships
- If not, assigns them to a "Default" vertical
- Creates the "Default" vertical if it doesn't exist

**File:** `/lib/auth/config.ts`

Updated the GitHub OAuth callback to call `ensureUserHasVertical()` for:
- **New GitHub users** - right after account creation
- **Existing users** - when they link GitHub to an existing account

This ensures ALL GitHub OAuth users are automatically assigned to at least one vertical.

### 2. Migration Script for Existing Users

**File:** `/scripts/fix-github-users-vertical.ts`

Created a migration script that:
- Finds all existing users without vertical assignments
- Assigns them to the "Default" vertical
- Reports which projects are now accessible
- Can be run with: `npm run fix:github-users`

## How It Works

### For New GitHub OAuth Users

```typescript
// When user signs in with GitHub:
1. User account is created/updated in database
2. ensureUserHasVertical(userId) is called
3. Function checks if user has any verticals
4. If not, assigns user to "Default" vertical
5. getUserProjects() now returns projects from Default vertical
6. User sees projects in dashboard ✅
```

### For Existing Users

```bash
# Admin runs the fix script:
npm run fix:github-users

# Script output:
# - Lists all users without verticals
# - Creates "Default" vertical if needed
# - Assigns all orphaned users to Default vertical
# - Shows which projects are now accessible
```

## Key Features

### Idempotent
- Safe to run multiple times
- Won't create duplicate vertical assignments
- Won't overwrite existing assignments

### Smart Defaults
- Creates "Default" vertical only once
- Reuses existing "Default" vertical if it exists
- Only assigns users who have NO verticals

### Non-Breaking
- Doesn't affect users who already have vertical assignments
- Doesn't change admin users' access (they see all projects anyway)
- Doesn't modify project memberships

## Files Modified

1. **`/lib/auth/helpers.ts`** (NEW)
   - Contains `ensureUserHasVertical()` helper function
   - Handles vertical assignment logic

2. **`/lib/auth/config.ts`** (MODIFIED)
   - Imports and calls helper function
   - Updated for both new and existing users

3. **`/scripts/fix-github-users-vertical.ts`** (NEW)
   - Migration script for existing users
   - Comprehensive reporting

4. **`/package.json`** (MODIFIED)
   - Added `fix:github-users` script command

5. **Documentation Updated:**
   - `/scripts/README.md`
   - `/GITHUB_USER_TROUBLESHOOTING.md`
   - `/GITHUB_OAUTH_FIX.md` (this file)

## Usage

### For New Deployments

No action needed! New GitHub OAuth users will automatically be assigned to a vertical.

### For Existing Deployments

1. **Deploy the code changes**

2. **Run the migration script:**
   ```bash
   npm run fix:github-users
   ```

3. **Verify the fix:**
   ```bash
   # Check a specific user
   npm run diagnose:user -- user@example.com

   # Should now show:
   # ✅ Has Vertical Memberships: Yes
   # Total Accessible Projects: [number of projects in Default vertical]
   ```

## Testing

### Test New User Flow

1. Sign out of Nexus
2. Sign in with a new GitHub account
3. Check dashboard - should see projects from "Default" vertical
4. Run diagnostic:
   ```bash
   npm run diagnose:user -- newuser@example.com
   ```
5. Verify vertical assignment shows up

### Test Migration Script

1. Create a test user without vertical (use Prisma Studio)
2. Run migration script:
   ```bash
   npm run fix:github-users
   ```
3. Verify user is now assigned to "Default" vertical
4. Check that user can now see projects

## Database Schema

### Tables Involved

```sql
-- Users table
users (
  id, email, name, github_id, github_username, ...
)

-- Verticals table
verticals (
  id, name, created_at, updated_at
)

-- Vertical membership join table
vertical_users (
  id, vertical_id, user_id, created_at
)

-- Projects table
projects (
  id, name, vertical_id, ...
)
```

### Query Impact

The `getUserProjects()` query (in `/server/actions/projects.ts`) now returns projects because:

```typescript
// Before fix: User has no vertical_users records → No projects
// After fix: User has vertical_users record → Gets projects from that vertical

db.project.findMany({
  where: {
    OR: [
      {
        vertical: {
          users: { some: { userId } }  // ← Now matches!
        }
      },
      {
        members: { some: { userId } }
      }
    ]
  }
})
```

## Admin Controls

Admins can still:
- Move users to different verticals via `/admin/members`
- Add users directly to specific projects
- Create new verticals
- Delete the "Default" vertical (if empty)

The "Default" vertical is just a fallback - admins have full control over vertical assignments.

## Future Considerations

### Alternative Approaches

If you want to customize the default vertical assignment:

1. **Change the default vertical name:**
   ```typescript
   // In lib/auth/helpers.ts
   const defaultVerticalName = "New Users"; // Instead of "Default"
   ```

2. **Assign to first available vertical instead:**
   ```typescript
   // Get first vertical instead of creating Default
   let vertical = await db.vertical.findFirst();
   if (!vertical) {
     vertical = await db.vertical.create({ ... });
   }
   ```

3. **Assign based on email domain:**
   ```typescript
   const domain = email.split('@')[1];
   let verticalName = domain === 'company.com' ? 'Internal' : 'External';
   ```

## Troubleshooting

### Script Shows "All users already have verticals"

This is good! It means:
- All users already have vertical assignments
- No orphaned users exist
- No action needed

### User Still Can't See Projects After Fix

Check if the "Default" vertical has any projects:

```bash
# Use Prisma Studio
npm run db:studio

# Check:
# 1. Verticals table - find "Default" vertical
# 2. Projects table - filter by vertical_id
```

If no projects exist in "Default" vertical:
- Create projects in that vertical, OR
- Move user to a vertical that has projects

### Error: "Vertical name already exists"

The "Default" vertical already exists. This is fine - the script will use it.

## Monitoring

After deploying this fix, monitor:

1. **New user signups:**
   - Check that new GitHub users can see projects immediately
   - Verify vertical assignment in database

2. **Error logs:**
   - Watch for any GitHub OAuth callback errors
   - Check for vertical creation failures

3. **User reports:**
   - Confirm "can't see projects" issues are resolved
   - Track any new edge cases

## Rollback

If needed, to rollback:

1. Revert code changes in:
   - `/lib/auth/config.ts`
   - Remove `/lib/auth/helpers.ts`

2. Optionally remove "Default" vertical:
   ```sql
   -- Only if you want to clean up
   DELETE FROM vertical_users WHERE vertical_id IN (
     SELECT id FROM verticals WHERE name = 'Default'
   );
   DELETE FROM verticals WHERE name = 'Default';
   ```

Note: This won't affect users - they'll just go back to not seeing projects until manually assigned.

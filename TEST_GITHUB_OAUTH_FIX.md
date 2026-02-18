# Testing GitHub OAuth Vertical Assignment Fix

## Prerequisites

- Nexus application running locally or deployed
- Access to admin account
- Ability to create test GitHub accounts (or use test accounts)
- Database access (Prisma Studio or diagnose script)

## Test Case 1: New GitHub OAuth User (Automatic Assignment)

### Setup
1. Ensure the code changes are deployed
2. Clear any test data if needed

### Test Steps

1. **Create/Use a GitHub account that has never signed into Nexus**
   - Use a test GitHub account or create a new one

2. **Sign in to Nexus with GitHub OAuth**
   ```
   - Visit the Nexus login page
   - Click "Sign in with GitHub"
   - Authorize the application
   - Complete OAuth flow
   ```

3. **Verify automatic vertical assignment**
   ```bash
   # Run diagnostic for the new user
   npm run diagnose:user -- <github-email>
   ```

4. **Expected Output:**
   ```
   👤 USER DETAILS
   Email:           <github-email>
   GitHub ID:       ✅ <github-id>
   GitHub Username: ✅ <username>

   🏢 VERTICAL MEMBERSHIPS
   1. Default
      ID: <vertical-id>
      Joined: <timestamp>

   📊 ANALYSIS
   ✅ Has Vertical Memberships: Yes
   ```

5. **Check Dashboard**
   - User should see any projects in the "Default" vertical
   - If no projects exist in Default vertical, dashboard will be empty (but no error)

### Expected Result
✅ New GitHub OAuth user is automatically assigned to "Default" vertical

---

## Test Case 2: Existing User Without Vertical (Migration Script)

### Setup
1. Create a test user without vertical assignment:
   ```bash
   npm run db:studio
   ```

2. In Prisma Studio:
   - Open `users` table
   - Create a new user record manually:
     - id: (random UUID)
     - email: test@example.com
     - name: Test User
     - role: member
     - githubId: 12345678
     - githubUsername: testuser
   - Save the record
   - Verify user has NO entries in `vertical_users` table

### Test Steps

1. **Verify user has no verticals**
   ```bash
   npm run diagnose:user -- test@example.com
   ```

   Expected:
   ```
   ❌ No vertical memberships
   Total Accessible Projects: 0
   ```

2. **Run the migration script**
   ```bash
   npm run fix:github-users
   ```

3. **Expected Script Output:**
   ```
   🔍 Checking for users without vertical assignments...

   Found 1 user(s) without verticals:

   1. Test User
      Email: test@example.com
      Role: member
      GitHub: ✅ testuser

   📁 Creating "Default" vertical...
   # OR: Using existing "Default" vertical

   🔧 Assigning users to default vertical...

   ✅ Assigned: Test User

   📊 Summary:
      ✅ Successfully assigned: 1

   ✅ Done! GitHub OAuth users will now see projects in their dashboard.
   ```

4. **Verify the fix**
   ```bash
   npm run diagnose:user -- test@example.com
   ```

   Expected:
   ```
   🏢 VERTICAL MEMBERSHIPS
   1. Default
      ID: <vertical-id>
      Joined: <timestamp>

   📊 ANALYSIS
   ✅ Has Vertical Memberships: Yes
   ```

### Expected Result
✅ Existing user is retroactively assigned to "Default" vertical

---

## Test Case 3: User Already Has Vertical (No Change)

### Setup
1. Use the admin account (already has vertical assignments)

### Test Steps

1. **Run the migration script**
   ```bash
   npm run fix:github-users
   ```

2. **Expected Output:**
   ```
   🔍 Checking for users without vertical assignments...

   ✅ All users already have vertical assignments!
   ```

3. **Verify admin's verticals unchanged**
   ```bash
   npm run diagnose:user -- admin@nexus.com
   ```

   - Should show existing verticals (NOT "Default")
   - No new assignments added

### Expected Result
✅ Users with existing verticals are not modified

---

## Test Case 4: Default Vertical Already Exists

### Setup
1. Create "Default" vertical manually:
   ```bash
   npm run db:studio
   ```

2. Create vertical:
   - id: (random UUID)
   - name: Default
   - Save

3. Create a project in Default vertical:
   - name: Test Project
   - verticalId: <default-vertical-id>
   - Save

### Test Steps

1. **Create a test user without vertical** (as in Test Case 2)

2. **Run migration script**
   ```bash
   npm run fix:github-users
   ```

3. **Expected Output:**
   ```
   📁 Using existing "Default" vertical

   📂 Projects in "Default" vertical (now accessible to all assigned users):
      1. Test Project
   ```

4. **Verify user can access the project**
   ```bash
   npm run diagnose:user -- test@example.com
   ```

   Expected:
   ```
   🎯 ACCESSIBLE PROJECTS
   1. Test Project
      Stats: X sprint(s), Y member(s)
   ```

### Expected Result
✅ Script reuses existing "Default" vertical
✅ User sees projects in Default vertical

---

## Test Case 5: Existing GitHub User Linking Account

### Setup
1. Create a user via email/password (no GitHub):
   - Register with email: linking@example.com
   - Do NOT use GitHub OAuth initially

2. Verify user exists:
   ```bash
   npm run diagnose:user -- linking@example.com
   ```

   Expected:
   ```
   GitHub ID:       ❌ NOT LINKED
   GitHub Username: ❌ NOT LINKED
   ```

### Test Steps

1. **Sign out and sign in with GitHub**
   - Use GitHub account with same email (linking@example.com)
   - Complete OAuth flow
   - GitHub account should link to existing user

2. **Verify vertical assignment**
   ```bash
   npm run diagnose:user -- linking@example.com
   ```

   Expected:
   ```
   GitHub ID:       ✅ <github-id>
   GitHub Username: ✅ <username>

   🏢 VERTICAL MEMBERSHIPS
   1. Default
      (or existing vertical if user was already in one)
   ```

### Expected Result
✅ When existing user links GitHub, ensureUserHasVertical() is called
✅ User gets Default vertical if they had none

---

## Test Case 6: Admin Assignment Overrides Default

### Setup
1. Create a GitHub OAuth user (gets "Default" vertical automatically)

### Test Steps

1. **Admin adds user to specific vertical**
   - Login as admin
   - Navigate to `/admin/members`
   - Find the user
   - Click "Manage Verticals"
   - Add user to "Product Engineering" vertical
   - Save

2. **Verify user has multiple verticals**
   ```bash
   npm run diagnose:user -- <user-email>
   ```

   Expected:
   ```
   🏢 VERTICAL MEMBERSHIPS
   1. Default
   2. Product Engineering
   ```

3. **Remove from Default if desired**
   - Admin can remove user from Default vertical
   - User will only see projects from Product Engineering

### Expected Result
✅ Default vertical doesn't prevent manual assignments
✅ Admins have full control over user verticals

---

## Test Case 7: Script Idempotency

### Setup
1. Have at least one user without verticals
2. Run the fix script once

### Test Steps

1. **Run script first time**
   ```bash
   npm run fix:github-users
   ```
   - Records success count

2. **Run script again immediately**
   ```bash
   npm run fix:github-users
   ```

3. **Expected Output:**
   ```
   ✅ All users already have vertical assignments!
   ```

### Expected Result
✅ Script is idempotent (safe to run multiple times)
✅ No duplicate assignments created
✅ No errors thrown

---

## Automated Test Script

For convenience, here's a test script that verifies the key functionality:

```bash
#!/bin/bash

echo "Testing GitHub OAuth Vertical Assignment Fix"
echo "=============================================="
echo ""

# Test 1: Check if Default vertical exists
echo "Test 1: Checking for Default vertical..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
db.vertical.findUnique({ where: { name: 'Default' } })
  .then(v => {
    if (v) console.log('✅ Default vertical exists');
    else console.log('⚠️  Default vertical not created yet');
  })
  .finally(() => db.\$disconnect());
"

# Test 2: Check users without verticals
echo ""
echo "Test 2: Finding users without verticals..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
db.user.findMany({
  where: { verticalUsers: { none: {} } },
  select: { email: true }
})
  .then(users => {
    if (users.length === 0) {
      console.log('✅ All users have vertical assignments');
    } else {
      console.log('⚠️  Found', users.length, 'users without verticals:');
      users.forEach(u => console.log('   -', u.email));
    }
  })
  .finally(() => db.\$disconnect());
"

# Test 3: Run the fix script
echo ""
echo "Test 3: Running fix script..."
npm run fix:github-users

echo ""
echo "=============================================="
echo "Tests complete!"
```

Save as `test-github-oauth-fix.sh` and run:
```bash
chmod +x test-github-oauth-fix.sh
./test-github-oauth-fix.sh
```

---

## Rollback Testing

If you need to test rollback:

1. **Backup database:**
   ```bash
   # Export data
   npx prisma db pull
   ```

2. **Remove Default vertical assignments:**
   ```sql
   -- Use Prisma Studio or SQL
   DELETE FROM vertical_users
   WHERE vertical_id IN (
     SELECT id FROM verticals WHERE name = 'Default'
   );
   ```

3. **Test the fix again from scratch**

---

## Success Criteria

All tests should pass with:
- ✅ New GitHub users automatically get "Default" vertical
- ✅ Existing users can be fixed with migration script
- ✅ Script is idempotent (safe to run multiple times)
- ✅ Existing vertical assignments are not modified
- ✅ Admin controls work as expected
- ✅ Users can see projects from their assigned verticals

## Troubleshooting Failed Tests

If a test fails:

1. **Check error messages carefully**
2. **Verify Prisma Client is generated:**
   ```bash
   npx prisma generate
   ```

3. **Check database connection:**
   ```bash
   npx prisma db pull
   ```

4. **Review server logs for OAuth errors**

5. **Verify environment variables:**
   - DATABASE_URL
   - GITHUB_CLIENT_ID
   - GITHUB_CLIENT_SECRET
   - NEXTAUTH_SECRET

6. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run build
   ```

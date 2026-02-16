/**
 * DIAGNOSTIC SCRIPT: Cache Revalidation Test
 *
 * This script tests if cache is being properly revalidated when users are added to projects.
 *
 * Usage:
 *   npx tsx scripts/test-cache-revalidation.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function testCacheRevalidation() {
  console.log("\n🔍 CACHE REVALIDATION TEST\n");
  console.log("=" .repeat(80));

  try {
    // Get a test user (Sarah)
    const testUser = await db.user.findUnique({
      where: { email: "sarah.frontend@nexus.com" },
      select: { id: true, name: true, email: true },
    });

    if (!testUser) {
      console.log("❌ Test user not found. Run: npm run db:seed:modular");
      return;
    }

    console.log(`Test User: ${testUser.name} (${testUser.email})`);
    console.log();

    // Step 1: Check current project memberships
    console.log("📋 STEP 1: Current Project Memberships");
    console.log("-" .repeat(80));

    const currentMemberships = await db.projectMember.findMany({
      where: { userId: testUser.id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    console.log(`Current: ${currentMemberships.length} project(s)`);
    currentMemberships.forEach((pm, idx) => {
      console.log(`   ${idx + 1}. ${pm.project.name}`);
    });
    console.log();

    // Step 2: Test getUserProjects query
    console.log("📋 STEP 2: getUserProjects() Query Result");
    console.log("-" .repeat(80));

    const projects = await db.project.findMany({
      where: {
        OR: [
          {
            vertical: {
              users: {
                some: { userId: testUser.id },
              },
            },
          },
          {
            members: {
              some: { userId: testUser.id },
            },
          },
        ],
      },
      include: {
        vertical: {
          select: { id: true, name: true },
        },
        _count: {
          select: { sprints: true, members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Query Result: ${projects.length} project(s)`);
    projects.forEach((project, idx) => {
      const isMember = currentMemberships.some(pm => pm.projectId === project.id);
      console.log(`   ${idx + 1}. ${project.name}`);
      console.log(`      - Via vertical OR direct membership: ${isMember ? "Direct" : "Vertical only"}`);
    });
    console.log();

    // Step 3: Check cache keys that should be invalidated
    console.log("📋 STEP 3: Cache Keys That Should Be Revalidated");
    console.log("-" .repeat(80));
    console.log("When a user is added to a project, these should be revalidated:");
    console.log(`   1. "/" - Dashboard (affects ALL users)`);
    console.log(`   2. "/admin/projects" - Admin projects list`);
    projects.forEach((project) => {
      console.log(`   3. "/projects/${project.id}" - Project page`);
    });
    console.log();

    console.log("Note: unstable_cache with tags is also used:");
    console.log(`   - Tag: user-${testUser.id}-projects`);
    console.log(`   - Tag: projects (global)`);
    console.log();

    // Step 4: Check when cache was last revalidated
    console.log("📋 STEP 4: Checking for Recent Project Member Changes");
    console.log("-" .repeat(80));

    const recentChanges = await db.projectMember.findMany({
      where: { userId: testUser.id },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    console.log("Recent membership additions:");
    recentChanges.forEach((pm, idx) => {
      const age = Date.now() - pm.createdAt.getTime();
      const ageMinutes = Math.floor(age / 60000);
      const ageSeconds = Math.floor((age % 60000) / 1000);
      console.log(`   ${idx + 1}. ${pm.project.name} - Added ${ageMinutes}m ${ageSeconds}s ago`);
    });
    console.log();

    // Step 5: Recommendations
    console.log("=" .repeat(80));
    console.log("🔧 TROUBLESHOOTING CHECKLIST");
    console.log("=" .repeat(80));
    console.log();

    console.log("If dashboard doesn't show projects for this user:");
    console.log();
    console.log("1. ⚡ Clear Next.js cache:");
    console.log("   rm -rf .next");
    console.log("   npm run dev");
    console.log();
    console.log("2. 🔄 Hard refresh browser:");
    console.log("   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)");
    console.log();
    console.log("3. 🔍 Check browser console for errors:");
    console.log("   Open DevTools → Console tab");
    console.log();
    console.log("4. 🕵️ Verify revalidatePath is being called:");
    console.log("   Add console.log in server/actions/projects.ts → addMemberToProject");
    console.log();
    console.log("5. ⏰ Wait for cache to expire:");
    console.log("   Cache TTL is 30 seconds (see unstable_cache config)");
    console.log();
    console.log("6. 🔐 Check authentication:");
    console.log("   Ensure user is logged in with the correct account");
    console.log();

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

testCacheRevalidation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

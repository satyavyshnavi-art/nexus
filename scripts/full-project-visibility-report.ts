/**
 * COMPREHENSIVE PROJECT VISIBILITY REPORT
 *
 * This script generates a complete report on project visibility for all users.
 * It helps identify why certain users can or cannot see projects.
 *
 * Usage:
 *   npx tsx scripts/full-project-visibility-report.ts [user-email]
 *
 * Examples:
 *   npx tsx scripts/full-project-visibility-report.ts                     # All users
 *   npx tsx scripts/full-project-visibility-report.ts sarah.frontend@nexus.com  # Specific user
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function generateReport(targetEmail?: string) {
  console.log("\n📊 PROJECT VISIBILITY REPORT\n");
  console.log("=" .repeat(80));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log("=" .repeat(80) + "\n");

  try {
    // Get all users
    const users = targetEmail
      ? await db.user.findMany({
          where: { email: targetEmail },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          orderBy: { name: "asc" },
        })
      : await db.user.findMany({
          where: { role: "member" }, // Skip admin for clarity
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
          orderBy: { name: "asc" },
        });

    if (users.length === 0) {
      console.log("❌ No users found\n");
      return;
    }

    // Get all projects for context
    const allProjects = await db.project.findMany({
      include: {
        vertical: { select: { name: true } },
        members: { select: { userId: true } },
      },
    });

    console.log("📋 OVERVIEW");
    console.log("-" .repeat(80));
    console.log(`Total Users (members): ${users.length}`);
    console.log(`Total Projects: ${allProjects.length}`);
    console.log();

    // Report for each user
    for (const user of users) {
      console.log("=" .repeat(80));
      console.log(`👤 ${user.name} (${user.email})`);
      console.log("=" .repeat(80));
      console.log();

      // 1. Check vertical assignments
      const verticals = await db.verticalUser.findMany({
        where: { userId: user.id },
        include: {
          vertical: {
            select: {
              id: true,
              name: true,
              _count: { select: { projects: true } },
            },
          },
        },
      });

      console.log("📁 VERTICALS:");
      if (verticals.length === 0) {
        console.log("   ❌ NOT assigned to any verticals");
        console.log("   → This user CANNOT see any projects!");
        console.log();
        continue;
      }

      verticals.forEach((v, idx) => {
        console.log(`   ${idx + 1}. ${v.vertical.name} (${v.vertical._count.projects} projects)`);
      });
      console.log();

      // 2. Check direct project memberships
      const memberships = await db.projectMember.findMany({
        where: { userId: user.id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              verticalId: true,
              vertical: { select: { name: true } },
            },
          },
        },
      });

      console.log("🔗 DIRECT PROJECT MEMBERSHIPS:");
      if (memberships.length === 0) {
        console.log("   ⚠️  NOT a direct member of any projects");
      } else {
        memberships.forEach((m, idx) => {
          console.log(`   ${idx + 1}. ${m.project.name} (${m.project.vertical.name})`);
        });
      }
      console.log();

      // 3. Run getUserProjects query
      const visibleProjects = await db.project.findMany({
        where: {
          OR: [
            {
              vertical: {
                users: {
                  some: { userId: user.id },
                },
              },
            },
            {
              members: {
                some: { userId: user.id },
              },
            },
          ],
        },
        include: {
          vertical: { select: { name: true } },
          _count: { select: { sprints: true, members: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log("👁️  VISIBLE PROJECTS (what getUserProjects() returns):");
      if (visibleProjects.length === 0) {
        console.log("   ❌ User sees NO projects");
        console.log();
      } else {
        console.log(`   ✅ User sees ${visibleProjects.length} project(s):\n`);

        visibleProjects.forEach((p, idx) => {
          const isDirect = memberships.some(m => m.projectId === p.id);
          const accessType = isDirect ? "Direct Member" : "Via Vertical";

          console.log(`   ${idx + 1}. ${p.name}`);
          console.log(`      Vertical: ${p.vertical.name}`);
          console.log(`      Access: ${accessType}`);
          console.log(`      Sprints: ${p._count.sprints} | Members: ${p._count.members}`);
          console.log();
        });
      }

      // 4. Analysis
      console.log("🔍 ANALYSIS:");
      const hasVerticals = verticals.length > 0;
      const hasDirectMemberships = memberships.length > 0;
      const hasVisibleProjects = visibleProjects.length > 0;

      if (!hasVerticals) {
        console.log("   ❌ PROBLEM: User has no vertical assignments");
        console.log("   🔧 FIX: Admin should assign user to a vertical");
      } else if (!hasVisibleProjects) {
        console.log("   ❌ PROBLEM: User has verticals but no visible projects");
        console.log("   🔧 FIX: Either:");
        console.log("       1. Create projects in user's verticals, OR");
        console.log("       2. Add user as member to existing projects");
      } else {
        console.log("   ✅ User is properly configured");
        console.log(`   ✅ Can access ${visibleProjects.length} project(s)`);

        if (!hasDirectMemberships) {
          console.log(`   ℹ️  Note: Access is via vertical only (no direct memberships)`);
        } else {
          console.log(`   ℹ️  Has ${memberships.length} direct membership(s) + vertical access`);
        }
      }
      console.log();
    }

    // Summary table
    console.log("=" .repeat(80));
    console.log("📊 SUMMARY TABLE");
    console.log("=" .repeat(80));
    console.log();
    console.log("User                  | Verticals | Direct | Visible | Status");
    console.log("-" .repeat(80));

    for (const user of users) {
      const verticals = await db.verticalUser.count({
        where: { userId: user.id },
      });

      const directMemberships = await db.projectMember.count({
        where: { userId: user.id },
      });

      const visibleProjects = await db.project.count({
        where: {
          OR: [
            { vertical: { users: { some: { userId: user.id } } } },
            { members: { some: { userId: user.id } } },
          ],
        },
      });

      const status = visibleProjects > 0 ? "✅ OK" : verticals > 0 ? "⚠️  No Projects" : "❌ No Vertical";
      const name = user.name?.padEnd(20).substring(0, 20) || "Unknown".padEnd(20);

      console.log(
        `${name} | ${verticals.toString().padStart(9)} | ${directMemberships.toString().padStart(6)} | ${visibleProjects.toString().padStart(7)} | ${status}`
      );
    }
    console.log();

    // Key findings
    console.log("=" .repeat(80));
    console.log("🔑 KEY FINDINGS");
    console.log("=" .repeat(80));
    console.log();
    console.log("1. 📌 VERTICAL ASSIGNMENT IS CRITICAL");
    console.log("   → Users MUST be assigned to a vertical to see any projects");
    console.log();
    console.log("2. 📌 TWO WAYS TO SEE PROJECTS:");
    console.log("   → A) Via Vertical: User sees ALL projects in their vertical(s)");
    console.log("   → B) Direct Member: User is explicitly added to specific projects");
    console.log();
    console.log("3. 📌 THE QUERY LOGIC (getUserProjects):");
    console.log("   → Returns projects where: (user in vertical) OR (user is member)");
    console.log("   → This means vertical assignment gives broad access");
    console.log();
    console.log("4. 📌 COMMON ISSUE:");
    console.log("   → If dashboard shows 'No Projects', check:");
    console.log("     a) User is assigned to a vertical");
    console.log("     b) Projects exist in that vertical");
    console.log("     c) Cache is revalidated (hard refresh)");
    console.log();

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

// Main execution
const userEmail = process.argv[2];

generateReport(userEmail)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

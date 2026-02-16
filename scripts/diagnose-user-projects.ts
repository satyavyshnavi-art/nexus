/**
 * DIAGNOSTIC SCRIPT: User Project Visibility
 *
 * This script checks why assigned projects aren't visible to users.
 *
 * Usage:
 *   npx tsx scripts/diagnose-user-projects.ts <user-email>
 *
 * Example:
 *   npx tsx scripts/diagnose-user-projects.ts sarah.johnson@nexus.com
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface DiagnosticResult {
  success: boolean;
  step: string;
  message: string;
  data?: any;
}

async function diagnoseUserProjects(userEmail: string) {
  const results: DiagnosticResult[] = [];

  console.log("\n🔍 DIAGNOSTIC REPORT: User Project Visibility\n");
  console.log("=" .repeat(80));
  console.log(`Checking user: ${userEmail}`);
  console.log("=" .repeat(80) + "\n");

  // Step 1: Find the user
  console.log("📋 STEP 1: Finding User");
  console.log("-" .repeat(80));
  try {
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      results.push({
        success: false,
        step: "Find User",
        message: `❌ User not found with email: ${userEmail}`,
      });
      console.log(`❌ User not found\n`);
      return results;
    }

    results.push({
      success: true,
      step: "Find User",
      message: `✅ User found: ${user.name} (${user.role})`,
      data: user,
    });
    console.log(`✅ User found:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log();

    // Step 2: Check vertical assignments
    console.log("📋 STEP 2: Checking Vertical Assignments");
    console.log("-" .repeat(80));
    const verticalAssignments = await db.verticalUser.findMany({
      where: { userId: user.id },
      include: {
        vertical: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { projects: true },
            },
          },
        },
      },
    });

    if (verticalAssignments.length === 0) {
      results.push({
        success: false,
        step: "Vertical Assignment",
        message: `❌ User is NOT assigned to any verticals`,
      });
      console.log(`❌ User is NOT assigned to any verticals`);
      console.log(`   → This is the problem! Users need to be assigned to a vertical first.\n`);
      return results;
    }

    results.push({
      success: true,
      step: "Vertical Assignment",
      message: `✅ User is assigned to ${verticalAssignments.length} vertical(s)`,
      data: verticalAssignments.map(v => v.vertical),
    });
    console.log(`✅ User is assigned to ${verticalAssignments.length} vertical(s):`);
    verticalAssignments.forEach((va, idx) => {
      console.log(`   ${idx + 1}. ${va.vertical.name} (${va.vertical._count.projects} projects)`);
    });
    console.log();

    // Step 3: Check direct project memberships
    console.log("📋 STEP 3: Checking Direct Project Memberships");
    console.log("-" .repeat(80));
    const projectMemberships = await db.projectMember.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            verticalId: true,
            vertical: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (projectMemberships.length === 0) {
      results.push({
        success: false,
        step: "Project Membership",
        message: `❌ User is NOT a member of any projects`,
      });
      console.log(`❌ User is NOT a member of any projects`);
      console.log(`   → This is the problem! User needs to be added as a project member.\n`);
    } else {
      results.push({
        success: true,
        step: "Project Membership",
        message: `✅ User is a member of ${projectMemberships.length} project(s)`,
        data: projectMemberships.map(pm => pm.project),
      });
      console.log(`✅ User is a member of ${projectMemberships.length} project(s):`);
      projectMemberships.forEach((pm, idx) => {
        console.log(`   ${idx + 1}. ${pm.project.name}`);
        console.log(`      - Vertical: ${pm.project.vertical.name}`);
        console.log(`      - Description: ${pm.project.description || "No description"}`);
      });
      console.log();
    }

    // Step 4: Run the actual getUserProjects() query logic
    console.log("📋 STEP 4: Simulating getUserProjects() Query");
    console.log("-" .repeat(80));
    const isAdmin = user.role === "admin";

    const projects = await db.project.findMany({
      where: isAdmin
        ? {}
        : {
            // This is the EXACT query from getUserProjects()
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
        vertical: {
          select: { id: true, name: true },
        },
        _count: {
          select: { sprints: true, members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    results.push({
      success: projects.length > 0,
      step: "getUserProjects() Query",
      message: projects.length > 0
        ? `✅ Query returns ${projects.length} project(s)`
        : `❌ Query returns 0 projects (should show projects!)`,
      data: projects,
    });

    if (projects.length === 0) {
      console.log(`❌ Query returns 0 projects`);
      console.log(`   → The getUserProjects() query is NOT working!\n`);
    } else {
      console.log(`✅ Query returns ${projects.length} project(s):`);
      projects.forEach((project, idx) => {
        console.log(`   ${idx + 1}. ${project.name}`);
        console.log(`      - Vertical: ${project.vertical.name}`);
        console.log(`      - Sprints: ${project._count.sprints}`);
        console.log(`      - Members: ${project._count.members}`);
      });
      console.log();
    }

    // Step 5: Check available projects in user's verticals
    console.log("📋 STEP 5: Checking Available Projects in User's Verticals");
    console.log("-" .repeat(80));
    const availableProjects = await db.project.findMany({
      where: {
        verticalId: {
          in: verticalAssignments.map(va => va.verticalId),
        },
      },
      include: {
        vertical: {
          select: { name: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    console.log(`📊 Found ${availableProjects.length} total project(s) in user's verticals:`);
    availableProjects.forEach((project, idx) => {
      const isMember = projectMemberships.some(pm => pm.projectId === project.id);
      console.log(`   ${idx + 1}. ${project.name}`);
      console.log(`      - Vertical: ${project.vertical.name}`);
      console.log(`      - Members: ${project._count.members}`);
      console.log(`      - User is member: ${isMember ? "✅ YES" : "❌ NO"}`);
    });
    console.log();

    // Step 6: Final Summary
    console.log("=" .repeat(80));
    console.log("📊 SUMMARY");
    console.log("=" .repeat(80));

    const hasVerticals = verticalAssignments.length > 0;
    const hasProjects = projectMemberships.length > 0;
    const queryWorks = projects.length > 0;

    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Role: ${user.role}`);
    console.log(`Assigned to verticals: ${hasVerticals ? "✅ YES" : "❌ NO"}`);
    console.log(`Member of projects: ${hasProjects ? "✅ YES" : "❌ NO"}`);
    console.log(`getUserProjects() returns data: ${queryWorks ? "✅ YES" : "❌ NO"}`);
    console.log();

    if (!hasVerticals) {
      console.log("🔧 FIX: Assign user to a vertical using admin panel");
      console.log(`   → Go to /admin/verticals → Select vertical → Add user\n`);
    } else if (!hasProjects) {
      console.log("🔧 FIX: Add user as a project member using admin panel");
      console.log(`   → Go to /admin/projects → Select project → Manage Members → Add user\n`);
    } else if (!queryWorks) {
      console.log("🔧 FIX: There's a bug in the getUserProjects() query or caching issue");
      console.log(`   → Try clearing Next.js cache: rm -rf .next`);
      console.log(`   → Check the query logic in server/actions/projects.ts\n`);
    } else {
      console.log("✅ Everything looks good! User should see their projects.\n");
      console.log("If dashboard still shows 'No Projects', it might be a caching issue:");
      console.log(`   1. Hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)`);
      console.log(`   2. Clear Next.js cache: rm -rf .next && npm run dev`);
      console.log(`   3. Check browser console for errors\n`);
    }

    return results;

  } catch (error) {
    console.error("\n❌ ERROR during diagnosis:", error);
    results.push({
      success: false,
      step: "Diagnostic",
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
    return results;
  } finally {
    await db.$disconnect();
  }
}

// Main execution
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("❌ Error: Please provide a user email");
  console.log("\nUsage:");
  console.log("  npx tsx scripts/diagnose-user-projects.ts <user-email>");
  console.log("\nExample:");
  console.log("  npx tsx scripts/diagnose-user-projects.ts sarah.johnson@nexus.com");
  process.exit(1);
}

diagnoseUserProjects(userEmail)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

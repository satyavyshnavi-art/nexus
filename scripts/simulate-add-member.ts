/**
 * DIAGNOSTIC SCRIPT: Simulate Adding Member to Project
 *
 * This script simulates what happens when an admin adds a user to a project,
 * and checks if the cache revalidation works correctly.
 *
 * Usage:
 *   npx tsx scripts/simulate-add-member.ts <project-name> <user-email>
 *
 * Example:
 *   npx tsx scripts/simulate-add-member.ts "Payment Gateway Module" mike.backend@nexus.com
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function simulateAddMember(projectName: string, userEmail: string) {
  console.log("\n🔄 SIMULATE: Adding Member to Project\n");
  console.log("=" .repeat(80));

  try {
    // Step 1: Find the user
    console.log("📋 STEP 1: Finding User");
    console.log("-" .repeat(80));
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
      console.log(`❌ User not found: ${userEmail}\n`);
      return;
    }

    console.log(`✅ User: ${user.name} (${user.email})`);
    console.log();

    // Step 2: Find the project
    console.log("📋 STEP 2: Finding Project");
    console.log("-" .repeat(80));
    const project = await db.project.findFirst({
      where: { name: projectName },
      include: {
        vertical: {
          include: {
            users: true,
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!project) {
      console.log(`❌ Project not found: ${projectName}\n`);
      return;
    }

    console.log(`✅ Project: ${project.name}`);
    console.log(`   Vertical: ${project.vertical.name}`);
    console.log(`   Current Members: ${project.members.length}`);
    console.log();

    // Step 3: Check if user is in the project's vertical
    console.log("📋 STEP 3: Checking Vertical Membership");
    console.log("-" .repeat(80));
    const userInVertical = project.vertical.users.some(
      (vu) => vu.userId === user.id
    );

    if (!userInVertical) {
      console.log(`❌ User is NOT in project's vertical (${project.vertical.name})`);
      console.log(`   → User must be assigned to the vertical first!\n`);
      return;
    }

    console.log(`✅ User is in project's vertical (${project.vertical.name})`);
    console.log();

    // Step 4: Check if user is already a member
    console.log("📋 STEP 4: Checking Current Project Membership");
    console.log("-" .repeat(80));
    const alreadyMember = project.members.some((m) => m.userId === user.id);

    if (alreadyMember) {
      console.log(`⚠️  User is ALREADY a member of this project`);
      console.log();
    } else {
      console.log(`✅ User is NOT yet a member (can be added)`);
      console.log();
    }

    // Step 5: Check what the user currently sees
    console.log("📋 STEP 5: BEFORE - What User Currently Sees");
    console.log("-" .repeat(80));

    const projectsBefore = await db.project.findMany({
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
        vertical: {
          select: { name: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    console.log(`User sees ${projectsBefore.length} project(s):`);
    projectsBefore.forEach((p, idx) => {
      const isMemberNow = project.members.some(m => m.userId === user.id && m.projectId === p.id);
      console.log(`   ${idx + 1}. ${p.name} (${p.vertical.name}) - ${isMemberNow ? "Member" : "Vertical only"}`);
    });
    console.log();

    // Step 6: Add user as member (if not already)
    if (!alreadyMember) {
      console.log("📋 STEP 6: Adding User as Project Member");
      console.log("-" .repeat(80));

      await db.projectMember.upsert({
        where: {
          projectId_userId: { projectId: project.id, userId: user.id },
        },
        create: { projectId: project.id, userId: user.id },
        update: {},
      });

      console.log(`✅ User added as member of "${project.name}"`);
      console.log();

      // Step 7: Check what the user sees AFTER
      console.log("📋 STEP 7: AFTER - What User Should See");
      console.log("-" .repeat(80));

      const projectsAfter = await db.project.findMany({
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
          vertical: {
            select: { name: true },
          },
          _count: {
            select: { members: true },
          },
        },
      });

      console.log(`User should see ${projectsAfter.length} project(s):`);
      projectsAfter.forEach((p, idx) => {
        const wasNew = !projectsBefore.some(pb => pb.id === p.id);
        console.log(`   ${idx + 1}. ${p.name} (${p.vertical.name}) ${wasNew ? "← NEW!" : ""}`);
      });
      console.log();

      // Step 8: Cache revalidation
      console.log("📋 STEP 8: Cache Revalidation Needed");
      console.log("-" .repeat(80));
      console.log("⚠️  NOTE: This script does NOT trigger revalidatePath()");
      console.log("    In the actual app, these paths should be revalidated:");
      console.log();
      console.log(`    1. revalidatePath("/") - Dashboard (all users)`);
      console.log(`    2. revalidatePath("/projects/${project.id}") - Project page`);
      console.log(`    3. revalidatePath("/admin/projects") - Admin projects list`);
      console.log();
      console.log("    Cache tags that should expire:");
      console.log(`    1. user-${user.id}-projects (user-specific cache)`);
      console.log(`    2. projects (global cache)`);
      console.log();
    }

    // Final summary
    console.log("=" .repeat(80));
    console.log("📊 SUMMARY");
    console.log("=" .repeat(80));
    console.log();
    console.log(`✅ User: ${user.name}`);
    console.log(`✅ Project: ${project.name}`);
    console.log(`✅ Status: ${alreadyMember ? "Already member" : "Member added successfully"}`);
    console.log();

    if (!alreadyMember) {
      console.log("🔍 To verify this worked in the app:");
      console.log("   1. Login as the user");
      console.log("   2. Navigate to dashboard (/)");
      console.log("   3. Hard refresh (Cmd+Shift+R)");
      console.log("   4. Check if the project appears");
      console.log();
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

// Main execution
const projectName = process.argv[2];
const userEmail = process.argv[3];

if (!projectName || !userEmail) {
  console.error("❌ Error: Missing arguments");
  console.log("\nUsage:");
  console.log("  npx tsx scripts/simulate-add-member.ts <project-name> <user-email>");
  console.log("\nExample:");
  console.log('  npx tsx scripts/simulate-add-member.ts "Payment Gateway Module" mike.backend@nexus.com');
  process.exit(1);
}

simulateAddMember(projectName, userEmail)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

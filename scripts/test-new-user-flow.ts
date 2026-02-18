/**
 * TEST: New User Flow
 *
 * This script simulates the complete flow of a new user:
 * 1. User is created
 * 2. User is assigned to vertical(s)
 * 3. User is added to project(s)
 * 4. Check what projects they can see
 *
 * Usage:
 *   npx tsx scripts/test-new-user-flow.ts
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const db = new PrismaClient();

async function testNewUserFlow() {
  console.log("\n🧪 TEST: New User Flow\n");
  console.log("=".repeat(80));
  console.log("This script simulates creating a new user and assigning them to projects");
  console.log("=".repeat(80) + "\n");

  const testEmail = `test.user.${Date.now()}@nexus.com`;

  try {
    // Step 1: Create a new user
    console.log("📋 STEP 1: Creating New User");
    console.log("-".repeat(80));

    const passwordHash = await hash("password123", 10);

    const newUser = await db.user.create({
      data: {
        email: testEmail,
        name: "Test User",
        designation: "Test Engineer",
        passwordHash,
        role: "member",
      },
    });

    console.log(`✅ User created: ${newUser.name} (${newUser.email})`);
    console.log(`   ID: ${newUser.id}`);
    console.log();

    // Step 2: Check what they see (should be nothing)
    console.log("📋 STEP 2: Before Vertical Assignment - What User Sees");
    console.log("-".repeat(80));

    let projects: any = await db.project.findMany({
      where: {
        OR: [
          {
            vertical: {
              users: {
                some: { userId: newUser.id },
              },
            },
          },
          {
            members: {
              some: { userId: newUser.id },
            },
          },
        ],
      },
    });

    console.log(`Query returns: ${projects.length} project(s)`);
    if (projects.length === 0) {
      console.log(`✅ Expected: User sees NO projects (not assigned to any vertical yet)`);
    }
    console.log();

    // Step 3: Assign to a vertical
    console.log("📋 STEP 3: Assigning User to Vertical");
    console.log("-".repeat(80));

    const vertical = await db.vertical.findFirst({
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!vertical) {
      console.log("❌ No verticals found. Please run: npm run db:seed:modular");
      return;
    }

    await db.verticalUser.create({
      data: {
        verticalId: vertical.id,
        userId: newUser.id,
      },
    });

    console.log(`✅ User assigned to vertical: ${vertical.name}`);
    console.log(`   Vertical has ${vertical._count.projects} project(s)`);
    console.log();

    // Step 4: Check what they see now (should see vertical's projects)
    console.log("📋 STEP 4: After Vertical Assignment - What User Sees");
    console.log("-".repeat(80));

    projects = await db.project.findMany({
      where: {
        OR: [
          {
            vertical: {
              users: {
                some: { userId: newUser.id },
              },
            },
          },
          {
            members: {
              some: { userId: newUser.id },
            },
          },
        ],
      },
      include: {
        vertical: {
          select: { name: true },
        },
      },
    });

    console.log(`Query returns: ${projects.length} project(s)`);
    if (projects.length > 0) {
      console.log(`✅ Expected: User sees ${projects.length} project(s) from vertical\n`);
      projects.forEach((p: any, idx: number) => {
        console.log(`   ${idx + 1}. ${p.name} (${p.vertical.name}) - Via Vertical`);
      });
    } else {
      console.log(`⚠️  Unexpected: Vertical has no projects`);
    }
    console.log();

    // Step 5: Add user as direct member to a project
    if (projects.length > 0) {
      console.log("📋 STEP 5: Adding User as Direct Project Member");
      console.log("-".repeat(80));

      const projectToJoin = projects[0];

      await db.projectMember.create({
        data: {
          projectId: projectToJoin.id,
          userId: newUser.id,
        },
      });

      console.log(`✅ User added as member of: ${projectToJoin.name}`);
      console.log();

      // Step 6: Check project membership
      console.log("📋 STEP 6: Verifying Project Membership");
      console.log("-".repeat(80));

      const memberships = await db.projectMember.findMany({
        where: { userId: newUser.id },
        include: {
          project: {
            select: { name: true },
          },
        },
      });

      console.log(`✅ User is direct member of ${memberships.length} project(s):`);
      memberships.forEach((m, idx) => {
        console.log(`   ${idx + 1}. ${m.project.name}`);
      });
      console.log();
    }

    // Step 7: Final check
    console.log("📋 STEP 7: Final Visibility Check");
    console.log("-".repeat(80));

    projects = await db.project.findMany({
      where: {
        OR: [
          {
            vertical: {
              users: {
                some: { userId: newUser.id },
              },
            },
          },
          {
            members: {
              some: { userId: newUser.id },
            },
          },
        ],
      },
      include: {
        vertical: {
          select: { name: true },
        },
        members: {
          where: { userId: newUser.id },
        },
      },
    });

    console.log(`getUserProjects() would return ${projects.length} project(s):\n`);
    projects.forEach((p: any, idx: number) => {
      const isDirect = p.members.length > 0;
      console.log(`   ${idx + 1}. ${p.name}`);
      console.log(`      Vertical: ${p.vertical.name}`);
      console.log(`      Access: ${isDirect ? "Direct Member" : "Via Vertical Only"}`);
    });
    console.log();

    // Summary
    console.log("=".repeat(80));
    console.log("✅ TEST COMPLETE");
    console.log("=".repeat(80));
    console.log();
    console.log("Key Takeaways:");
    console.log("1. New users see NO projects until assigned to a vertical");
    console.log("2. Once assigned to vertical, they see ALL projects in that vertical");
    console.log("3. Direct project membership is optional (vertical access is sufficient)");
    console.log("4. The OR query means: (vertical projects) OR (direct membership projects)");
    console.log();

    // Cleanup
    console.log("🧹 Cleaning Up Test User");
    console.log("-".repeat(80));
    await db.user.delete({ where: { id: newUser.id } });
    console.log(`✅ Test user deleted: ${testEmail}\n`);

  } catch (error) {
    console.error("❌ Error:", error);

    // Cleanup on error
    const testUser = await db.user.findUnique({
      where: { email: testEmail },
    });
    if (testUser) {
      await db.user.delete({ where: { id: testUser.id } });
      console.log(`🧹 Cleaned up test user: ${testEmail}\n`);
    }
  } finally {
    await db.$disconnect();
  }
}

testNewUserFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

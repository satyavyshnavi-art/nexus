#!/usr/bin/env tsx
/**
 * Fix GitHub OAuth Users - Assign to Default Vertical
 *
 * This script fixes existing GitHub OAuth users who don't have any vertical assignments.
 * It ensures all users (especially GitHub OAuth users) are assigned to at least one vertical
 * so they can see projects in their dashboard.
 *
 * Usage:
 *   npx tsx scripts/fix-github-users-vertical.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = new PrismaClient();

async function main() {
  console.log("🔍 Checking for users without vertical assignments...\n");

  // Find all users who don't have any vertical memberships
  const usersWithoutVerticals = await db.user.findMany({
    where: {
      verticals: {
        none: {},
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      githubId: true,
      githubUsername: true,
      role: true,
    },
  });

  if (usersWithoutVerticals.length === 0) {
    console.log("✅ All users already have vertical assignments!");
    return;
  }

  console.log(`Found ${usersWithoutVerticals.length} user(s) without verticals:\n`);
  usersWithoutVerticals.forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.name || user.email}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   GitHub: ${user.githubId ? `✅ ${user.githubUsername}` : "❌ Not linked"}`);
    console.log();
  });

  // Get or create default vertical
  const defaultVerticalName = "Default";
  let defaultVertical = await db.vertical.findUnique({
    where: { name: defaultVerticalName },
  });

  if (!defaultVertical) {
    console.log(`📁 Creating "${defaultVerticalName}" vertical...\n`);
    defaultVertical = await db.vertical.create({
      data: {
        id: randomUUID(),
        name: defaultVerticalName,
      },
    });
  } else {
    console.log(`📁 Using existing "${defaultVerticalName}" vertical\n`);
  }

  // Assign all users to default vertical
  console.log("🔧 Assigning users to default vertical...\n");
  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutVerticals) {
    try {
      await db.verticalUser.create({
        data: {
          id: randomUUID(),
          verticalId: defaultVertical.id,
          userId: user.id,
        },
      });
      console.log(`✅ Assigned: ${user.name || user.email}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to assign ${user.email}:`, error);
      errorCount++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Successfully assigned: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`);
  }
  console.log();

  // Show which projects are now accessible to these users
  const projectsInDefaultVertical = await db.project.findMany({
    where: {
      verticalId: defaultVertical.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (projectsInDefaultVertical.length > 0) {
    console.log(`📂 Projects in "${defaultVerticalName}" vertical (now accessible to all assigned users):`);
    projectsInDefaultVertical.forEach((project, idx) => {
      console.log(`   ${idx + 1}. ${project.name}`);
    });
  } else {
    console.log(`⚠️  Note: The "${defaultVerticalName}" vertical has no projects yet.`);
    console.log(`   Users will see projects once projects are created in this vertical,`);
    console.log(`   or they are added to other verticals/projects.`);
  }

  console.log("\n✅ Done! GitHub OAuth users will now see projects in their dashboard.");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

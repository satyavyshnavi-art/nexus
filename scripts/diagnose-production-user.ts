
import { PrismaClient } from "@prisma/client";
import { getUserProjects } from "../server/actions/projects";

// Mock auth for the action if needed, or just replicate the query
// We will replicate the query logic to see what the DB sees
const db = new PrismaClient();

async function main() {
    const targetUsername = "satyavyshnavi-art"; // From screenshot

    console.log(`🔍 Diagnosing user: ${targetUsername}`);

    // 1. Find the user
    const user = await db.user.findFirst({
        where: {
            OR: [
                { githubUsername: targetUsername },
                { name: targetUsername },
                { email: { contains: targetUsername } } // Loose match
            ]
        },
        include: {
            projectMemberships: {
                include: { project: true }
            },
            verticals: {
                include: { vertical: true }
            }
        }
    });

    if (!user) {
        console.error("❌ User not found!");
        return;
    }

    console.log("✅ User Found:");
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- GitHub ID: ${user.githubId}`);

    // 2. Check Memberships
    console.log("\n📂 Direct Project Memberships:");
    if (user.projectMemberships.length === 0) {
        console.log("  (None)");
    } else {
        user.projectMemberships.forEach(pm => {
            console.log(`  - Project: ${pm.project.name} (ID: ${pm.project.id})`);
        });
    }

    console.log("\n🏢 Vertical Memberships:");
    if (user.verticals.length === 0) {
        console.log("  (None)");
    } else {
        user.verticals.forEach(vu => {
            console.log(`  - Vertical: ${vu.vertical.name} (ID: ${vu.vertical.id})`);
        });
    }

    // 3. Run the exact query logic from getUserProjects
    console.log("\n🕵️‍♀️ Simulating getUserProjects Query:");
    const projects = await db.project.findMany({
        where: {
            // Get projects where user is a member through vertical OR project membership
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
        select: { id: true, name: true }
    });

    console.log(`Found ${projects.length} accessible projects via query:`);
    projects.forEach(p => console.log(`  - ${p.name} (${p.id})`));

}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());

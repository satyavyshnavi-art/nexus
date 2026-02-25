
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("🧪 Testing Project Creation with Members...");

    // 1. Create Data
    const adminEmail = `admin.${Date.now()}@test.com`;
    const userEmail = `user.${Date.now()}@test.com`;

    const admin = await db.user.create({
        data: { email: adminEmail, name: "Admin", role: "admin" }
    });

    const user = await db.user.create({
        data: { email: userEmail, name: "User", role: "developer" }
    });

    // Create a vertical
    const vertical = await db.vertical.create({
        data: { name: `Vertical ${Date.now()}` }
    });

    console.log("✅ Created users and vertical");

    // 2. Simulate Create Project with Members
    // This matches the code I wrote in projects.ts
    console.log("📝 Creating Project with Direct Member assignment...");
    const project = await db.project.create({
        data: {
            name: `Project ${Date.now()}`,
            verticalId: vertical.id,
            createdBy: admin.id,
            members: {
                create: [{ userId: user.id }]
            }
        }
    });

    console.log(`✅ Project created: ${project.id}`);

    // 3. Verify Visibility
    // This matches getUserProjects logic
    console.log("🔍 Verifying User Visibility...");
    const userProjects = await db.project.findMany({
        where: {
            OR: [
                { vertical: { users: { some: { userId: user.id } } } }, // User is NOT in vertical
                { members: { some: { userId: user.id } } } // User IS in members
            ]
        }
    });

    if (userProjects.length === 1 && userProjects[0].id === project.id) {
        console.log("✅ SUCCESS: User sees the project via direct membership!");
    } else {
        console.error("❌ FAILURE: User cannot see the project.");
        console.error(`Found ${userProjects.length} projects.`);
    }

    // Cleanup
    await db.project.delete({ where: { id: project.id } });
    await db.vertical.delete({ where: { id: vertical.id } });
    await db.user.deleteMany({ where: { id: { in: [admin.id, user.id] } } });
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());

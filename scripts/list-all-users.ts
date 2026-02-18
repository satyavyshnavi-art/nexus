
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("🔍 Listing all users in database...");

    const users = await db.user.findMany({
        include: {
            projectMemberships: true,
            verticals: true
        }
    });

    console.log(`Found ${users.length} users:`);
    console.table(users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        githubId: u.githubId,
        role: u.role,
        designation: u.designation,
        projects: u.projectMemberships.length,
        verticals: u.verticals.length
    })));
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());

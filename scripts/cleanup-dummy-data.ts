import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KEEP_EMAILS = [
    "admin@nexus.com",
    "satyavyshnavi@stanzasoft.com",
    "vyshnavimanthena22@gmail.com"
];

async function main() {
    console.log("🧹 Starting cleanup of dummy data...");

    // 1. Delete all Task Comments
    const deletedComments = await prisma.taskComment.deleteMany();
    console.log(`- Deleted ${deletedComments.count} task comments`);

    // 2. Delete all Task Attachments
    const deletedAttachments = await prisma.taskAttachment.deleteMany();
    console.log(`- Deleted ${deletedAttachments.count} task attachments`);

    // 3. Delete all Tasks
    const deletedTasks = await prisma.task.deleteMany();
    console.log(`- Deleted ${deletedTasks.count} tasks`);

    // 4. Delete all Sprints
    const deletedSprints = await prisma.sprint.deleteMany();
    console.log(`- Deleted ${deletedSprints.count} sprints`);

    // 5. Delete all Project Members
    const deletedProjectMembers = await prisma.projectMember.deleteMany();
    console.log(`- Deleted ${deletedProjectMembers.count} project memberships`);

    // 6. Delete all Projects
    const deletedProjects = await prisma.project.deleteMany();
    console.log(`- Deleted ${deletedProjects.count} projects`);

    // 7. Delete Vertical Users (for users we are about to delete)
    // We'll delete ALL vertical users first, then maybe re-assign kept users if needed?
    // Or we can just delete vertical users for the users we are deleting.
    // Simpler: Delete all vertical users, then deletes verticals.
    // But wait, if we keep 'Verticals', do we keep 'VerticalUser' for kept users?
    // Seed created 'Product Engineering'. If we delete it, we delete it.
    // The user asked to remove "dummy data". The verticals created by seed are likely dummy.
    // Safe bet: Delete all structure, keep the USER accounts.

    await prisma.verticalUser.deleteMany();
    console.log(`- Deleted all vertical memberships`);

    await prisma.vertical.deleteMany();
    console.log(`- Deleted all verticals`);

    // 8. Delete Users except the ones to keep
    const deletedUsers = await prisma.user.deleteMany({
        where: {
            email: {
                notIn: KEEP_EMAILS,
            },
        },
    });
    console.log(`- Deleted ${deletedUsers.count} dummy users`);

    console.log("\n✅ Cleanup complete!");
    console.log(`Preserved users: ${KEEP_EMAILS.join(", ")}`);
}

main()
    .catch((e) => {
        console.error("❌ Cleanup failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


import { db } from "@/server/db";

async function main() {
    const userId = "355d0b4f-ecd5-49ba-9f7f-e28b01c75d03"; // from previous logs
    console.log(`Testing profile fetch for user: ${userId}`);

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                designation: true,
                bio: true,
                avatar: true,
                role: true,
                createdAt: true,
                assignedTasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        type: true,
                        createdAt: true,
                        sprint: {
                            select: {
                                name: true,
                                project: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                projectMemberships: {
                    select: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            console.error("❌ User not found in DB");
            return;
        }
        console.log("✅ User found in DB");

        // Calculate statistics
        console.log("Calculating stats...");
        const totalTasks = await db.task.count({
            where: { assigneeId: userId },
        });
        console.log(`Total tasks: ${totalTasks}`);

        const completedTasks = await db.task.count({
            where: {
                assigneeId: userId,
                status: "done",
            },
        });
        console.log(`Completed tasks: ${completedTasks}`);

        const activeProjects = user.projectMemberships.length;
        console.log(`Active projects: ${activeProjects}`);

        console.log("✅ Profile fetch successful");
        console.log(JSON.stringify({ ...user, stats: { totalTasks, completedTasks, activeProjects } }, null, 2));

    } catch (error) {
        console.error("❌ Error fetching profile:", error);
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());

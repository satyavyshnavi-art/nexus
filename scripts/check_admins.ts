
import { db } from "../server/db";

async function main() {
    const email = "vyshanvi@example.com"; // I need to know the user's email, but I'll list all admins first.

    console.log("--- List of Admins ---");
    const admins = await db.user.findMany({
        where: { role: "admin" },
        select: { id: true, name: true, email: true, role: true }
    });
    console.log(admins);

    console.log("\n--- All Users (First 10) ---");
    const users = await db.user.findMany({
        take: 10,
        select: { id: true, name: true, email: true, role: true }
    });
    console.log(users);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });

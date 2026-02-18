
import { db } from "@/server/db";

async function main() {
    const zombieId = "328e06bf-6dec-449f-9967-2c3f88bb3dd9";
    console.log(`Checking for user ID: ${zombieId}`);

    const user = await db.user.findUnique({
        where: { id: zombieId }
    });

    if (user) {
        console.log("✅ User FOUND in database:", user);
    } else {
        console.log("❌ User NOT FOUND in database. This is a zombie session.");
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());


import { db } from "@/server/db";
import { ensureUserHasVertical } from "@/lib/auth/helpers";

async function main() {
    const email = "satyavyshnavi@stanzasoft.com"; // User from logs
    console.log(`Promoting user with email: ${email} to ADMIN...`);

    const user = await db.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`❌ User not found with email: ${email}`);

        // Try finding by fuzzy match or listing all
        console.log("Listing available users:");
        const allUsers = await db.user.findMany();
        console.table(allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
        return;
    }

    // 1. Promote to Admin
    const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { role: "admin" },
    });
    console.log(`✅ User promoted to ADMIN: ${updatedUser.role}`);

    // 2. Ensure Vertical
    console.log("Checking vertical assignment...");
    await ensureUserHasVertical(user.id);

    const vertical = await db.verticalUser.findFirst({
        where: { userId: user.id },
        include: { vertical: true },
    });

    if (vertical) {
        console.log(`✅ User is in vertical: ${vertical.vertical.name}`);
    } else {
        console.error("❌ User still has no vertical!");
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());


import { db } from "@/server/db";

async function main() {
    const email = "satyavyshnavi@stanzasoft.com";
    console.log(`Demoting user with email: ${email} to MEMBER...`);

    const user = await db.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error(`❌ User not found with email: ${email}`);
        return;
    }

    const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { role: "developer" },
    });

    console.log(`✅ User demoted to: ${updatedUser.role}`);
    console.log(`User ID: ${updatedUser.id}`);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());

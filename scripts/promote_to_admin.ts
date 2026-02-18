
import { db } from "../server/db";

async function main() {
    const email = "satyavyshnavi@stanzasoft.com"; // Assuming this is the user based on previous context

    console.log(`Promoting ${email} to admin...`);

    const user = await db.user.update({
        where: { email },
        data: { role: "admin" },
    });

    console.log("User updated:", user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });

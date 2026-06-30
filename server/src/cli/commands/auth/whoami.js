import chalk from "chalk";
import { Command } from "commander";
import { getStoredToken, requireAuth } from "../../../lib/token.js";
import prisma from "../../../lib/db.js";

const URL = "http://localhost:3005";

export async function whoamiAction(opts) {
    await requireAuth();
    const token = await getStoredToken();
    if (!token?.access_token) {
        console.log("No access token found. please login.");
        process.exit(1);
    }

    const user = await prisma.user.findFirst({
        where: {
            sessions: {
                some: {
                    token: token.access_token,
                },
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    });

    // Output user session Info
    console.log(
        chalk.bold.greenBright(`\n👤 User: ${user.name} 
            \n📧 Email: ${user.email}
            \n🆔 User ID: ${user.id}\n`)
    );
}

export const whoami = new Command("whoami")
    .description("Display the currently authenticated user")
    .option("--server-url <url>", "The Better Auth Server URL", URL)
    .action(whoamiAction);
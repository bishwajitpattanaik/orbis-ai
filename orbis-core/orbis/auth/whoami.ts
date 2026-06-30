import chalk from "chalk";
import { Command } from "commander";
import { getStoredToken, requireAuth } from "./token";
import { getUserFromToken } from "./user";

export async function whoamiAction() {
    await requireAuth();

    const token = await getStoredToken();
    if (!token?.access_token) {
        console.log(chalk.red("No access token found. Please login."));
        process.exit(1);
    }

    const user = await getUserFromToken(token.access_token);

    if (!user) {
        console.log(chalk.red("User not found. Please login again."));
        process.exit(1);
    }

    console.log(chalk.bold.greenBright(`\nName:  ${user.name}`));
    console.log(chalk.bold.greenBright(`Email: ${user.email}`));
    console.log(chalk.bold.greenBright(`ID:    ${user.id}\n`));
}

export const whoami = new Command("whoami")
    .description("Display the currently authenticated user")
    .action(whoamiAction);
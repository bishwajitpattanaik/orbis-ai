#!/usr/bin/env node

// Global Imports
import dotenv from 'dotenv';
import chalk from 'chalk';
import figlet from 'figlet';

import { Command } from 'commander';

// Local Imports
import { login } from './commands/auth/login.js';
import { logout } from './commands/auth/logout.js';
import { whoami } from './commands/auth/whoami.js';
import { wakeUp } from './commands/ai/wakeUp.js';

dotenv.config();


async function main() {
    // Display Banner
    console.log(
        chalk.redBright.bold(
            figlet.textSync("ORBIS", {
                font: "Standard",
                horizontalLayout: "default",
            })
        )
    )

    console.log(chalk.yellowBright.bold("  ✨ Set your ideas in motion — The AI that lives in your terminal! ✨\n"));

    const program = new Command("Orbis");

   program
  .version("1.0.0")
  .description(
    "⬡ An AI-powered CLI that brings your ideas to life — chat, build, automate, and ship, all from your terminal."
  )
  .addCommand(login)
  .addCommand(logout)
  .addCommand(whoami)
  .addCommand(wakeUp)

    // Default action shows help
    program.action(() => {
        program.help();
    });

    program.parse();
}

main().catch((err) => {
    console.error(chalk.red("Error running Orbis CLI:"), err);
    process.exit(1);
})
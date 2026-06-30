#!/usr/bin/env bun

import dotenv from 'dotenv';
import chalk from 'chalk';
import { Command } from 'commander';
import { login } from './auth/login';
import { logout } from './auth/logout';
import { whoami } from './auth/whoami';
import { wakeUp } from './tui/wakeup';
import { runInit } from './tui/init';

dotenv.config();

async function main() {
    const program = new Command("orbis");

    program
        .version("0.1.5")
        .description("An AI-powered CLI that brings your ideas to life — chat, build, automate, and ship, all from your terminal.")
        .addCommand(login)
        .addCommand(logout)
        .addCommand(whoami)
        .addCommand(wakeUp)

    program
        .command("init")
        .description("Set up your API keys to get started with Orbis")
        .option("-f, --force", "Reconfigure even if already set up")
        .action(async (opts) => {
            await runInit(opts.force);
        });

    program.action(() => {
        program.help();
    });

    await program.parseAsync(process.argv);
}

main().catch((err) => {
    console.error(chalk.red("Error running Orbis CLI:"), err);
    process.exit(1);
});
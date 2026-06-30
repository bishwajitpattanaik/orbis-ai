import chalk from 'chalk';
import { Command } from 'commander';
import yoctoSpinner from 'yocto-spinner';
import boxen from 'boxen';
import { select, isCancel } from '@clack/prompts';
import figlet from 'figlet';
import { getStoredToken } from '../auth/token';
import { runCliMode } from '../modes/cli';
import { runTelegramMode } from '../modes/telegram/index';
import { getUserFromToken } from '../auth/user'
// ─── Figlet Banner ────────────────────────────────────────────────────────────

const BANNER_FONT = 'ANSI Shadow';

function printBanner() {
    let ascii: string;
    try {
        ascii = figlet.textSync("ORBIS", { font: BANNER_FONT });
    } catch {
        ascii = figlet.textSync("ORBIS", { font: "Standard" });
    }
    console.log(chalk.hex('#f59e0b').bold(ascii));
    console.log(chalk.yellowBright.bold("✨ Set your ideas in motion – The AI that lives in your terminal! ✨\n"));
}

// ─── Wakeup Action ────────────────────────────────────────────────────────────

const wakeUpAction = async () => {
    printBanner();

    const token = await getStoredToken();

    if (!token?.access_token) {
        console.log(boxen(
            chalk.redBright.bold('Session not found!') + '\n\n' +
            chalk.white('Run ') + chalk.cyanBright.bold('orbis login') + chalk.white(' to proceed!'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'redBright',
                title: chalk.redBright.bold(' Authentication Required '),
                titleAlignment: 'center',
            }
        ));
        return;
    }

    const spinner = yoctoSpinner({
        text: chalk.cyanBright("Verifying session..."),
        color: 'cyan'
    });
    spinner.start();

    const user = await getUserFromToken(token.access_token);

    spinner.stop();

    if (!user) {
        console.log(boxen(
            chalk.redBright.bold('Session expired.') + '\n\n' +
            chalk.white('Run ') + chalk.cyanBright.bold('orbis login') + chalk.white(' again.'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'redBright',
                title: chalk.redBright.bold(' Session Error '),
                titleAlignment: 'center',
            }
        ));
        return;
    }

    console.log(boxen(
        chalk.yellowBright.bold(`Welcome back, ${user.name}!`) + '\n\n' +
        chalk.greenBright.bold('Your workspace is live and ready.') + '\n' +
        chalk.gray('What would you like to do today?'),
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: 'round',
            borderColor: 'yellowBright',
            title: chalk.yellowBright.bold(' Orbis '),
            titleAlignment: 'center',
        }
    ));

    const choice = await select({
        message: chalk.yellowBright.bold("Choose your path:"),
        options: [
            {
                value: "cli",
                label: chalk.cyanBright.bold("CLI Mode"),
                hint: chalk.gray("Connect with Orbis via your terminal"),
            },
            {
                value: "telegram",
                label: chalk.greenBright.bold("Telegram Mode"),
                hint: chalk.gray("Connect with Orbis via Telegram"),
            },
            {
                value: "exit",
                label: chalk.white.bold("Exit"),
                hint: chalk.gray("Quit Orbis"),
            },
        ],
    });

    if (isCancel(choice) || choice === "exit") {
        console.log(chalk.dim("\nGoodbye.\n"));
        return;
    }

    if (choice === "cli") {
        await runCliMode(user.id);
    } else if (choice === "telegram") {
        await runTelegramMode();
    }
};

export const wakeUp = new Command("wakeup")
    .description("Start Orbis AI")
    .action(wakeUpAction);
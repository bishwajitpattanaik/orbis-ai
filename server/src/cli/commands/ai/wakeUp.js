// Global Imports
import chalk from 'chalk';
import { Command } from 'commander';
import yoctoSpinner from 'yocto-spinner';
import boxen from 'boxen';

// Local Imports
import { getStoredToken } from '../../../lib/token.js';
import prisma from "../../../lib/db.js";
import { select } from '@clack/prompts';
import { startChat } from '../../chat/chat-with-ai.js';
import { startToolChat } from '../../chat/chat-with-ai-tool.js';
import { startAgentChat } from '../../chat/chat-with-ai-agent.js';


const wakeUpAction = async()=> {
    const token = await getStoredToken();

    if(!token?.access_token){
        console.log(boxen(
            chalk.redBright.bold('⚓ Session not found!⚓') + '\n\n' +
            chalk.white('Run ') + chalk.cyanBright.bold('orbis login') + chalk.white(' to proceed!'),
            {
                padding: 1,
                borderStyle: 'bold',
                borderColor: 'redBright',
                title: chalk.redBright.bold(' 🔒 Authentication Required '),
                titleAlignment: 'center',
                textAlignment: 'center'
            }
        ));
        return;
    }

    const spinner = yoctoSpinner({
        text: chalk.cyanBright("Checking session logs..."),
        color: 'cyan'
    });
    spinner.start();

    const user = await prisma.user.findFirst({
        where: {
            sessions: {
                some: {
                    token:token.access_token
                }
            }
        },
        select: {
            id:true,
            name:true,
            email:true,
            image:true
        }
    });

    spinner.stop();

    if(!user){
        console.log(boxen(
            chalk.redBright.bold('OrbisAI not found!') + '\n\n' +
            chalk.white('Your session has expired.') + '\n' +
            chalk.white('Run ') + chalk.cyanBright.bold('orbis login') + chalk.white(' again!'),
            {
                padding: 1,
                borderStyle: 'bold',
                borderColor: 'redBright',
                title: chalk.redBright.bold(' ❌ Error '),
                titleAlignment: 'center',
                textAlignment: 'center'
            }
        ));
        return;
    }

    // Welcome banner
    console.log(boxen(
        chalk.yellowBright.bold(`✨ Welcome back, ${user.name}! ✨`) + '\n\n' +
        chalk.greenBright.bold('Your workspace is live and ready!') + '\n' +
        chalk.gray('What would you like to do today?'),
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: 'bold',
            borderColor: 'yellowBright',
            title: chalk.yellowBright.bold(' ⬡ Orbis '),
            titleAlignment: 'center',
            textAlignment: 'center'
        }
    ));

    const choice = await select({
        message: chalk.yellowBright.bold("⚓ Choose your path :"),
        options: [
            {
                value: "chat",
                label: chalk.cyanBright.bold("💬 Chat Mode"),
                hint: chalk.gray("Have a conversation with your Orbis AI"),
            },
            {
                value: "tool",
                label: chalk.greenBright.bold("🛠️  Tool Mode"),
                hint: chalk.gray("Use powerful tools (Search, Code Runner & more)"),
            },
            {
                value: "agent",
                label: chalk.magentaBright.bold("🤖 Agent Mode"),
                hint: chalk.gray("Autonomous App Generator - Build entire projects!"),
            },
        ],
    })

    switch(choice){
        case "chat":
           await startChat("chat");
            break;
        case "tool":
           await startToolChat("tool");
            break;
        case "agent":
            await startAgentChat("agent");
            break;
    }

}


export const wakeUp = new Command("wakeup")
    .description("⚓ Wake up Orbis AI and set sail on your coding adventure!")
    .action(wakeUpAction);
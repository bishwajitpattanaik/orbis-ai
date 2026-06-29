// Global imports
import chalk from 'chalk';
import boxen from 'boxen';
import { text, isCancel, cancel, intro, outro } from '@clack/prompts';
import yoctoSpinner from 'yocto-spinner';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

// Local imports
import { AIService } from '../ai/google.service.js';
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from '../../lib/token.js';
import prisma from '../../lib/db.js';

marked.use(
    markedTerminal({
        // Orbis CLI Theme
        code: chalk.blue,                              // Blue
        blockquote: chalk.yellow.italic,               // Yellow
        heading: chalk.red.bold,                       // Red
        firstHeading: chalk.redBright.bold.underline,  // Bright red for main heading
        hr: chalk.yellow,                              // yellow divider
        listitem: chalk.white,                         // Clean white
        list: chalk.white,                             // Clean white
        paragraph: chalk.white,                        // Clean white text
        strong: chalk.redBright.bold,                  // Bold red for emphasis
        em: chalk.yellow.italic,                       // Yellow italic
        codespan: chalk.blueBright.bgBlack,            // Blue code on black
        del: chalk.gray.strikethrough,                 // Gray for deleted
        link: chalk.yellowBright.underline,            // Bright yellow links
        href: chalk.yellowBright.underline,            // Bright yellow hrefs
    })
);


const aiService = new AIService();
const chatService = new ChatService();


async function getUserFromToken() {
    const token = await getStoredToken();
    if (!token?.access_token) {
        throw new Error("Not Authenticated. Please run 'orbis login' first.");
    }
    const spinner = yoctoSpinner({ text: "Authenticating..." }).start();
    const user = await prisma.user.findFirst({
        where: {
            sessions: {
                some: {
                    token: token.access_token
                },
            },
        },
    });

    if (!user) {
        spinner.error("User not Found");
        throw new Error("User not Found. Please login again.");
    }
    spinner.success(`Welcome back, ${user.name}!`);
    return user;
}


async function initConversation(userId, conversationId = null, mode = "chat") {
    const spinner = yoctoSpinner({ text: "Loading Conversation..." }).start();

    const conversation = await chatService.getOrCreateConversation(
        userId,
        conversationId,
        mode
    )

    spinner.success("Conversation Loaded.");

    // Display conversation info
    const conversationInfo = boxen(
        `${chalk.redBright.bold("Conversation")}: ${chalk.yellow(conversation.title)}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Mode: " + conversation.mode)}`,
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: "round",
            borderColor: "yellow",
            title: "Chat Session",
            titleAlignment: "center",
        }
    );

    console.log(conversationInfo);

    // Display existing messages if any
    if (conversation.messages?.length > 0) {
        console.log(chalk.yellowBright(" 📃 Previous messages:\n"));
        displayMessages(conversation.messages);
    }

    return conversation;
}

function displayMessages(messages) {
    messages.forEach((msg) => {
        if (msg.role === "user") {
            const userBox = boxen(chalk.white(msg.content), {
                padding: 1,
                margin: { left: 2, bottom: 1 },
                borderStyle: "round",
                borderColor: "blueBright",
                title: "👤 You",
                titleAlignment: "left",
            });
            console.log(userBox);
        } else {
            // Render markdown for assistant messages
            const renderedContent = marked.parse(msg.content);
            const assistantBox = boxen(renderedContent.trim(), {
                padding: 1,
                margin: { left: 2, bottom: 1 },
                borderStyle: "round",
                borderColor: "red",
                title: "⬡ Orbis AI",
                titleAlignment: "left",
            });
            console.log(assistantBox);
        }
    });
}

async function saveMessage(conversationId, role, content) {
    return await chatService.addMessage(conversationId, role, content);
}

async function getAIResponse(conversationId) {
    const spinner = yoctoSpinner({
        text: chalk.yellow("⬡ Orbis AI is Thinking...."),
        color: "yellow"
    }).start();

    const dbMessages = await chatService.getMessages(conversationId)
    const aiMessages = chatService.formatMessagesForAI(dbMessages)

    let fullResponse = ""

    let isFirstChunk = true;

    try {
        const result = await aiService.sendMessage(aiMessages , (chunk) => {
            if (isFirstChunk) {
                spinner.stop();
                console.log("\n");
                const header = chalk.yellowBright.bold("⬡ Orbis AI:\n");
                console.log(header);
                console.log(chalk.yellow("═".repeat(60)));
                isFirstChunk = false;
            }
            fullResponse += chunk;
        }); 

        // Now Rendering the complete response in markdown
        console.log("\n");
        const renderedMarkdown = marked.parse(fullResponse);
        console.log(renderedMarkdown);
        console.log(chalk.yellow("═".repeat(60)));
        console.log("\n");

        return result.content;
    } catch (error) {
        spinner.error("Failed to get AI response.");
        throw error;
    }
}

async function updateConversationTitle(conversationId, userInput, messageCount) {
    if (messageCount === 1) {
        const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
        await chatService.updateTitle(conversationId, title);
    }
}

async function chatLoop(conversation) {
    const helpBox = boxen(
        `${chalk.white('• Type your message and press Enter')}\n${chalk.white('• Markdown formatting is supported in responses')}\n${chalk.white('• Type "exit" to end the conversation')}\n${chalk.white('• Press Ctrl+c to quit anytime')}`,
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: "round",
            borderColor: "yellow",
            title: "Tips",
            titleAlignment: "center",
        }
    );

    console.log(helpBox);

    while (true) {
        const userInput = await text({
            message: chalk.blueBright("Your message:"),
            placeholder: "Type your message here",
            validate(value) {
                if (!value || value.trim().length === 0) {
                    return "Message cannot be empty.";
                }
            },
        });

        if (isCancel(userInput)) {
            const exitBox = boxen(chalk.yellowBright("See you next time!"), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "yellow",
                title: "🌊 Goodbye",
                titleAlignment: "center",
            });
            console.log(exitBox);
            process.exit(0);
        }

        if (userInput.toLowerCase() === "exit") {
            const exitBox = boxen(chalk.yellowBright("See you next adventure, Captain! ⚓👋"), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "yellow",
                title: "🌊 Goodbye",
                titleAlignment: "center",
            });
            console.log(exitBox);
            break;
        }

        await saveMessage(conversation.id, "user", userInput);

        const message = await chatService.getMessages(conversation.id);

        const aiResponse = await getAIResponse(conversation.id)

        await saveMessage(conversation.id, "assistant", aiResponse)

        await updateConversationTitle(conversation.id, userInput, message.length);
    }
}


export async function startChat(mode = "chat", conversationId = null) {
    try {
        console.log("\n");
        console.log(
            boxen(chalk.yellowBright.bold("  Orbis AI Chat  "), {
                padding: 1,
                margin: { left: 2 },
                borderStyle: "double",
                borderColor: "red",
                title: chalk.yellow("⬡ Orbis CLI"),
                titleAlignment: "center",
            })
        );

        const user = await getUserFromToken()
        const conversation = await initConversation(user.id, conversationId, mode);
        await chatLoop(conversation)

        outro(chalk.yellowBright(" ✧˖° Thanks for using Orbis AI! ⚓"))
    } catch (error) {
        const errorBox = boxen(chalk.redBright(`❌ ${error.message}`), {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "red",
            title: "⚠️ Error",
            titleAlignment: "center",
        });
        console.log(errorBox);
        process.exit(1);
    }
}
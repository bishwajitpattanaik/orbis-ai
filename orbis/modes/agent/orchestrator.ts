import { isCancel, text, spinner, select, confirm, intro, outro, cancel } from "@clack/prompts";
import chalk from "chalk";
import boxen from "boxen";
import yoctoSpinner from "yocto-spinner";
import { defaultAgentConfig } from "./types";
import { ActionTracker } from "./action-tracker";
import { ToolExecutor } from "./tool-executor";
import { createAgentTools } from "./agent-tools";
import { stepCountIs, ToolLoopAgent } from "ai";
import { getAgentModel } from "../../ai";
import { renderTerminalMarkdown } from "../../tui/terminal-md";
import { runApprovalFlow } from "./approval";
import { ChatService } from "../../services/chat.service";

const chatService = new ChatService();

const BOX_WIDTH = 60;

// ─── UI Helpers ────────────────────────────────────────────────────────────────

function printDivider(color: "cyan" | "magenta" | "gray" = "gray") {
    const line = "─".repeat(BOX_WIDTH + 4);
    const colorFn =
        color === "cyan"    ? chalk.cyanBright
        : color === "magenta" ? chalk.magentaBright
        : chalk.gray;
    console.log("\n" + colorFn(line) + "\n");
}

function printSessionBanner(conversation: any) {
    const banner = boxen(
        chalk.yellowBright.bold("Orbis Agent Session") + "\n\n" +
        chalk.cyanBright("  Task  : ") + chalk.white.bold(conversation.title || "Untitled") + "\n" +
        chalk.cyanBright("  ID    : ") + chalk.white.bold(conversation.id) + "\n" +
        chalk.cyanBright("  Mode  : ") + chalk.white.bold("Agent") + "\n" +
        chalk.cyanBright("  CWD   : ") + chalk.white.bold(process.cwd()),
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            width: BOX_WIDTH,
            borderStyle: "double",
            borderColor: "cyan",
            title: chalk.cyanBright.bold(" ⬡ Session Logs "),
            titleAlignment: "center",
        }
    );
    console.log(banner);
}

function printCapabilities() {
    const box = boxen(
        chalk.yellowBright.bold("What can Orbis AI Agent do for you today?") + "\n\n" +

        chalk.greenBright("✔") + " " + chalk.white("Read and navigate your entire codebase") + "\n" +
        chalk.greenBright("✔") + " " + chalk.white("Create, edit, and delete files autonomously") + "\n" +
        chalk.greenBright("✔") + " " + chalk.white("Run shell commands and inspect output") + "\n" +
        chalk.greenBright("✔") + " " + chalk.white("Stage all mutations — nothing applied without approval") + "\n" +
        chalk.greenBright("✔") + " " + chalk.white("Maintain full conversation history across sessions") + "\n" +
        chalk.greenBright("✔") + " " + chalk.white("Execute multi-step tasks with up to 40 tool loops") + "\n\n" +

        chalk.cyanBright.bold("Examples:") + "\n" +
        chalk.gray("  → ") + chalk.white('"Refactor auth module to use JWT"') + "\n" +
        chalk.gray("  → ") + chalk.white('"Add error handling to all API routes"') + "\n" +
        chalk.gray("  → ") + chalk.white('"Write unit tests for the payment service"') + "\n" +
        chalk.gray("  → ") + chalk.white('"Find all TODO comments and fix them"') + "\n\n" +

        chalk.gray.italic("Type exit or press Ctrl+C to quit"),
        {
            padding: 1,
            margin: { bottom: 1 },
            width: BOX_WIDTH,
            borderStyle: "round",
            borderColor: "green",
            title: chalk.greenBright.bold(" Agent Capabilities "),
            titleAlignment: "center",
        }
    );
    console.log(box);
}

function printUserPrompt(goal: string) {
    console.log(
        boxen(chalk.white(goal), {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            width: BOX_WIDTH,
            borderStyle: "double",
            borderColor: "cyan",
            title: chalk.cyanBright.bold(" You "),
            titleAlignment: "left",
        })
    );
}

function printAgentResponse(text: string) {
    console.log(
        boxen(renderTerminalMarkdown(text), {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            width: BOX_WIDTH,
            borderStyle: "round",
            borderColor: "magenta",
            title: chalk.magentaBright.bold(" ⬡ Orbis Agent "),
            titleAlignment: "left",
        })
    );
}

function printHistory(messages: any[]) {
    if (messages.length === 0) return;

    console.log(
        boxen(
            chalk.yellowBright.bold("Resuming previous session") + "\n" +
            chalk.gray(`Showing last ${Math.min(messages.length, 4)} message(s)`),
            {
                padding: { top: 0, bottom: 0, left: 2, right: 2 },
                margin: { top: 1, bottom: 0 },
                width: BOX_WIDTH,
                borderStyle: "single",
                borderColor: "yellow",
                title: chalk.yellowBright.bold(" ↩ History "),
                titleAlignment: "center",
            }
        )
    );

    messages.slice(-4).forEach((msg) => {
        if (msg.role === "user") {
            console.log(
                boxen(chalk.white(msg.content), {
                    padding: 1,
                    margin: { left: 2, bottom: 1, top: 1 },
                    width: BOX_WIDTH - 2,
                    borderStyle: "round",
                    borderColor: "cyan",
                    title: chalk.cyanBright.bold(" You "),
                    titleAlignment: "left",
                })
            );
        } else {
            console.log(
                boxen(
                    renderTerminalMarkdown(
                        typeof msg.content === "string"
                            ? msg.content
                            : JSON.stringify(msg.content)
                    ),
                    {
                        padding: 1,
                        margin: { left: 2, bottom: 1, top: 1 },
                        width: BOX_WIDTH - 2,
                        borderStyle: "round",
                        borderColor: "magenta",
                        title: chalk.magentaBright.bold(" ⬡ Orbis Agent "),
                        titleAlignment: "left",
                    }
                )
            );
        }
    });

    printDivider("cyan");
}

function printSuccess(label: string, detail?: string) {
    const content = chalk.greenBright.bold(`✔  ${label}`) +
        (detail ? "\n" + chalk.gray("   " + detail) : "");
    console.log(
        boxen(content, {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            margin: { top: 1, bottom: 1 },
            width: BOX_WIDTH,
            borderStyle: "round",
            borderColor: "green",
        })
    );
}

function printErrors(errors: string[]) {
    const lines = errors.map((e) => chalk.redBright("  • ") + chalk.white(e)).join("\n");
    console.log(
        boxen(
            chalk.redBright.bold("⚠  Some operations reported errors") + "\n\n" + lines,
            {
                padding: 1,
                margin: { top: 1, bottom: 1 },
                width: BOX_WIDTH,
                borderStyle: "double",
                borderColor: "red",
                title: chalk.redBright.bold(" Errors "),
                titleAlignment: "center",
            }
        )
    );
}

function printFatalError(message: string) {
    console.log(
        boxen(chalk.redBright.bold(`❌  ${message}`), {
            padding: 1,
            margin: 1,
            width: BOX_WIDTH,
            borderStyle: "double",
            borderColor: "red",
            title: chalk.redBright.bold(" Fatal Error "),
            titleAlignment: "center",
        })
    );
}

// ─── Session Picker ─────────────────────────────────────────────────────────────

async function pickConversation(userId: string): Promise<string | null> {
    const conversations = await chatService.getUserConversations(userId);
    if (conversations.length === 0) return null;

    const choice = await select({
        message: chalk.cyanBright("Continue a previous session or start fresh?"),
        options: [
            { value: "new", label: chalk.greenBright("✦  New Session"), hint: "Start from scratch" },
            ...conversations.slice(0, 8).map((c: any) => ({
                value: c.id,
                label: chalk.cyanBright("↩  " + (c.title || "Untitled")),
                hint: chalk.gray(new Date(c.updatedAt).toLocaleString()),
            })),
        ],
    });

    if (isCancel(choice) || choice === "new") return null;
    return choice as string;
}

// ─── Main Entry ─────────────────────────────────────────────────────────────────

export async function runAgentMode(userId: string) {
    try {
        // ── Intro Banner ──
        intro(
            boxen(
                chalk.magentaBright.bold("✨  Orbis — Agent Mode  ✨") + "\n\n" +
                chalk.whiteBright.bold("  ⬡  Orbis AI Agent  ") + "\n\n" +
                chalk.gray.italic(" Describe your idea. Orbis builds it. "),
                {
                    padding: 1,
                    width: BOX_WIDTH,
                    borderStyle: "double",
                    borderColor: "magenta",
                    textAlignment: "center",
                }
            )
        );

        // ── Pick or Create Conversation ──
        const conversationId = await pickConversation(userId);
        const conversation = await chatService.getOrCreateConversation(
            userId,
            conversationId,
            "agent"
        );

        // ── Session Info ──
        printSessionBanner(conversation);

        // ── File System Warning ──
        const shouldContinue = await confirm({
            message: chalk.yellowBright(
                "Orbis will make changes in your current working directory. Do you want to proceed?"
            ),
            initialValue: true,
        });

        if (isCancel(shouldContinue) || !shouldContinue) {
            cancel(chalk.yellowBright("Aborted. No changes were made. See you next time!"));
            process.exit(0);
        }

        // ── Show History if Resuming ──
        const messages = await chatService.getMessages(conversation.id);
        printHistory(messages);

        // ── Capabilities Panel ──
        printCapabilities();

        // ── Agent Loop ──
        while (true) {
            const goal = await text({
                message: chalk.yellow("What do you need help with?"),
                placeholder: "Describe any task you want Orbis to do for you...",
                validate(value) {
                    if (!value || value.trim().length === 0) return "Task cannot be empty.";
                    if (value.trim().length < 8) return "Please be more specific (at least 8 characters).";
                },
            });

            if (isCancel(goal)) {
                console.log(chalk.yellow("\nCancelled. Exiting agent mode.\n"));
                process.exit(0);
            }

            if ((goal as string).toLowerCase().trim() === "exit") {
                console.log(chalk.yellow("\nExiting agent mode.\n"));
                break;
            }

            const trimmedGoal = (goal as string).trim();

            // Echo user prompt
            printUserPrompt(trimmedGoal);

            // Persist user message
            await chatService.addMessage(conversation.id, "user", trimmedGoal);

            // Auto-title on first message
            if (messages.length === 0) {
                await chatService.updateTitle(conversation.id, trimmedGoal.slice(0, 50));
            }

            // ── Build Agent ──
            const config = defaultAgentConfig();
            const tracker = new ActionTracker();
            const executor = new ToolExecutor(tracker, config);
            const tools = createAgentTools(executor);

            const allMessages = await chatService.getMessages(conversation.id);
            const aiMessages = chatService.formatMessagesForAI(allMessages);

            const agent = new ToolLoopAgent({
                model: getAgentModel(),
                stopWhen: stepCountIs(40),
                instructions: [
                    `Workspace root: ${config.codebasePath}`,
                    "All changes are staged until the user approves them.",
                ].join("\n"),
                tools,
            });

            // ── Spinner While Agent Works ──
            const s = yoctoSpinner({ text: chalk.cyanBright("Agent is working…") }).start();

            const historyContext =
                aiMessages.length > 0
                    ? aiMessages
                          .map((m: any) => `${m.role}: ${m.content}`)
                          .join("\n") + "\n\n"
                    : "";

            let stepCount = 0;
            const result = await agent.generate({
                prompt: historyContext + trimmedGoal,
                onStepFinish: ({ toolCalls }) => {
                    stepCount++;
                    for (const tc of toolCalls) {
                        const preview = JSON.stringify(tc.input).slice(0, 100);
                        s.text =
                            chalk.cyanBright(`Step ${stepCount} › `) +
                            chalk.bold(String(tc.toolName)) +
                            " " +
                            chalk.dim(preview + (preview.length >= 100 ? "…" : ""));
                    }
                },
            });

            s.success(chalk.greenBright(`Done — ${stepCount} step(s) completed.`));

            // ── Agent Response ──
            if (result.text?.trim()) {
                printAgentResponse(result.text);
                await chatService.addMessage(conversation.id, "assistant", result.text.trim());
            }

            // ── Approval Flow ──
            const ok = await runApprovalFlow(tracker);

            if (!ok) {
                executor.clearStaging();
                console.log(
                    boxen(chalk.yellowBright.bold("↩  Changes discarded. Nothing was written to disk."), {
                        padding: { top: 0, bottom: 0, left: 2, right: 2 },
                        margin: { top: 1, bottom: 1 },
                        width: BOX_WIDTH,
                        borderStyle: "round",
                        borderColor: "yellow",
                    })
                );
            } else {
                const { errors } = executor.applyApprovedFromTracker();
                if (errors.length) {
                    printErrors(errors);
                } else {
                    printSuccess("All changes applied successfully.", `${config.codebasePath}`);
                }
                executor.clearStaging();
            }

            printDivider("cyan");

            // ── Continue? ──
            const { confirm: confirmFn, isCancel: isCancelFn } = await import("@clack/prompts");
            const continueAgent = await confirmFn({
                message: chalk.yellow("Would you need help with something else ?"),
                initialValue: true,
            });

            if (isCancelFn(continueAgent) || !continueAgent) break;
        }

        // ── Outro ─────────────────────────────────────────────────────────────────
        console.log(
            boxen(chalk.yellowBright("✨ Thanks for using Orbis. See you soon! ✨"), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "yellow",
                title: "🌊 Goodbye",
                titleAlignment: "center",
            })
        );

    } catch (error: any) {
        printFatalError(error.message ?? "An unexpected error occurred.");
        process.exit(1);
    }
}
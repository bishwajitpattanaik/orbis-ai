import chalk from "chalk";
import { confirm, isCancel, text, spinner, select } from "@clack/prompts";
import { ToolLoopAgent, stepCountIs, tool } from "ai";
import { z } from "zod";
import { getAgentModel } from "../../ai/ai.config.ts";
import { ActionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import { renderTerminalMarkdown } from "../../tui/terminal-md.ts";
import { runApprovalFlow } from "../agent/approval.ts";
import { createWebTools } from "../plan/web-tools.ts";
import { ChatService } from "../../services/chat.service.ts";
import boxen from "boxen";

const chatService = new ChatService();

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function divider(color: "yellow" | "red" | "cyan" = "yellow") {
    console.log(chalk[color]("─".repeat(60)));
}

function sectionHeader(icon: string, label: string) {
    console.log(
        boxen(`${icon}  ${chalk.yellowBright.bold(label)}`, {
            padding: { top: 0, bottom: 0, left: 2, right: 2 },
            margin: { top: 1, bottom: 0 },
            borderStyle: "round",
            borderColor: "yellow",
            titleAlignment: "center",
        })
    );
}

function successLine(label: string) {
    console.log(`\n${chalk.green("✔")} ${chalk.greenBright.bold(label)}\n`);
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

function createAskTools(executor: ToolExecutor) {
    return {
        read_file: tool({
            description: "Read a text file from the workspace. Use a path relative to the project root.",
            inputSchema: z.object({
                path: z.string().describe("Relative file path"),
            }),
            execute: async ({ path: p }) => executor.readFile(p),
        }),

        list_files: tool({
            description: "List files and directories under a path.",
            inputSchema: z.object({
                path: z.string(),
                recursive: z.boolean().optional().default(false),
            }),
            execute: async ({ path: p, recursive }) => executor.listFiles(p, recursive),
        }),

        search_files: tool({
            description: 'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
            inputSchema: z.object({
                root: z.string().describe("Directory to search, relative to root"),
                pattern: z.string().describe("Glob-like pattern using * and ** (forward slashes)"),
                content_contains: z.string().optional(),
            }),
            execute: async ({ root, pattern, content_contains }) =>
                executor.searchFiles(root, pattern, content_contains),
        }),

        analyze_codebase: tool({
            description: "Summarize structure: file counts, size, extensions. Read-only.",
            inputSchema: z.object({ path: z.string().default(".") }),
            execute: async ({ path: p }) => executor.analyzeCodebase(p),
        }),

        list_skills: tool({
            description: "List absolute paths to SKILL.md files under configured skill directories.",
            inputSchema: z.object({}),
            execute: async () => executor.listSkills(),
        }),

        read_skill: tool({
            description: "Read a SKILL.md file.",
            inputSchema: z.object({ path: z.string() }),
            execute: async ({ path: p }) => executor.readSkill(p),
        }),
    };
}

function asMd(question: string, answer: string): string {
    return `# Ask Mode\n\n## Question\n\n${question.trim()}\n\n## Answer\n\n${answer.trim()}\n`;
}

async function pickConversation(userId: string): Promise<string | null> {
    const conversations = await chatService.getUserConversations(userId);

    if (conversations.length === 0) return null;

    const choice = await select({
        message: chalk.yellowBright("Continue a previous session or start new?"),
        options: [
            { value: "new", label: chalk.greenBright("＋  New Session") },
            ...conversations.slice(0, 8).map((c: any) => ({
                value: c.id,
                label: chalk.cyanBright(c.title || "Untitled"),
                hint: chalk.gray(new Date(c.updatedAt).toLocaleString()),
            })),
        ],
    });

    if (isCancel(choice) || choice === "new") return null;
    return choice as string;
}

function displayHistory(messages: any[]) {
    if (messages.length === 0) return;

    sectionHeader("📃", "Previous Messages");
    console.log();

    messages.slice(-4).forEach((msg) => {
        if (msg.role === "user") {
            console.log(
                boxen(chalk.white(msg.content), {
                    padding: 1,
                    margin: { left: 2, bottom: 1 },
                    borderStyle: "round",
                    borderColor: "cyanBright",
                    title: chalk.cyanBright("👤 You"),
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
                        margin: { left: 2, bottom: 1 },
                        borderStyle: "round",
                        borderColor: "magentaBright",
                        title: chalk.magentaBright("⬡ Orbis AI"),
                        titleAlignment: "left",
                    }
                )
            );
        }
    });
}

export async function runAskMode(userId: string) {
    // ── Banner ────────────────────────────────────────────────────────────────
    console.log("\n");
    console.log(
        boxen(chalk.yellowBright.bold("  ❓  Ask Mode  "), {
            padding: 1,
            margin: { left: 2 },
            borderStyle: "double",
            borderColor: "greenBright",
            title: chalk.yellow("⬡ Orbis CLI"),
            titleAlignment: "center",
        })
    );

    // ── Session Setup ─────────────────────────────────────────────────────────
    const conversationId = await pickConversation(userId);
    const conversation = await chatService.getOrCreateConversation(userId, conversationId, "ask");

    // Session info box
    console.log(
        boxen(
            `${chalk.cyanBright("Session")}:  ${chalk.white.bold(conversation.title ?? "New Session")}\n` +
            `${chalk.cyanBright("ID:")}      ${chalk.white.bold(conversation.id)}\n` +
            `${chalk.cyanBright("Mode:")}    ${chalk.white.bold(conversation.mode)}`,
            {
                padding: 1,
                margin: { top: 1, bottom: 1 },
                borderStyle: "round",
                borderColor: "yellow",
                title: "Ask Session",
                titleAlignment: "center",
            }
        )
    );

    const messages = await chatService.getMessages(conversation.id);
    displayHistory(messages);

    // ── Tips ──────────────────────────────────────────────────────────────────
    console.log(
        boxen(
            `${chalk.white.bold("• Ask anything about your codebase or the web")}\n` +
            `${chalk.white.bold("• Orbis will research and respond with context")}\n` +
            `${chalk.white.bold("• You can save any answer to a .md file")}\n` +
            `${chalk.white.bold("• Press Ctrl+C to quit anytime")}`,
            {
                padding: 1,
                margin: { top: 0, bottom: 1 },
                borderStyle: "round",
                borderColor: "yellow",
                title: "Tips",
                titleAlignment: "center",
            }
        )
    );

    // ── Ask Loop ──────────────────────────────────────────────────────────────
    while (true) {
        divider("yellow");

        const question = await text({
            message: chalk.yellowBright("What do you want to ask?"),
            placeholder: "Type your question…",
        });
        if (isCancel(question) || !question?.trim()) break;

        await chatService.addMessage(conversation.id, "user", question.trim());

        if (messages.length === 0) {
            await chatService.updateTitle(conversation.id, question.trim().slice(0, 50));
        }

        const config = defaultAgentConfig();
        config.tools.allowFileCreation = true;
        config.tools.allowFileModification = false;
        config.tools.allowFolderCreation = false;
        config.tools.allowShellExecution = false;

        const tracker = new ActionTracker();
        const executor = new ToolExecutor(tracker, config);

        const tools = {
            ...createAskTools(executor),
            ...createWebTools(tracker),
        };

        const allMessages = await chatService.getMessages(conversation.id);
        const aiMessages = chatService.formatMessagesForAI(allMessages);

        const agent = new ToolLoopAgent({
            model: getAgentModel(),
            stopWhen: stepCountIs(20),
            tools,
        });

        // ── Thinking ──────────────────────────────────────────────────────────
        const s = spinner();
        s.start(chalk.yellow("⬡ Orbis AI is thinking"));

        const historyContext = aiMessages.length > 0
            ? aiMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n") + "\n\n"
            : "";

        const result = await agent.generate({
            prompt: historyContext + question.trim(),
        });

        s.stop();
        successLine("Done");

        const answer = result.text?.trim() || "(no answer)";

        // ── Answer Box ────────────────────────────────────────────────────────
        console.log(
            boxen(renderTerminalMarkdown(answer), {
                padding: 1,
                margin: { left: 2, bottom: 1 },
                borderStyle: "round",
                borderColor: "magentaBright",
                title: chalk.magentaBright("⬡ Orbis AI"),
                titleAlignment: "left",
            })
        );

        divider("red");

        await chatService.addMessage(conversation.id, "assistant", answer);

        // ── Save to MD ────────────────────────────────────────────────────────
        const wantsSave = await confirm({
            message: chalk.yellowBright("Save this answer to a .md file?"),
            initialValue: false,
        });

        if (!isCancel(wantsSave) && wantsSave) {
            const filename = await text({
                message: chalk.yellowBright("Filename"),
                initialValue: "ask.md",
                validate: (v) => {
                    const s = (v ?? "").trim();
                    if (!s) return "Required";
                    if (s.includes("..") || s.includes("/") || s.includes("\\")) return "No paths";
                    if (!s.toLowerCase().endsWith(".md")) return "Must end with .md";
                },
            });

            if (!isCancel(filename)) {
                executor.createFile(filename, asMd(question, answer));
                const ok = await runApprovalFlow(tracker);
                if (!ok) return executor.clearStaging();

                executor.applyApprovedFromTracker();
                executor.clearStaging();

                console.log(
                    boxen(chalk.greenBright(`✔  Saved to ${chalk.white.bold(filename)}`), {
                        padding: 1,
                        margin: { top: 1, bottom: 1 },
                        borderStyle: "round",
                        borderColor: "green",
                        title: "Saved",
                        titleAlignment: "center",
                    })
                );
            }
        }

        divider("yellow");

        const continueChat = await confirm({
            message: chalk.yellowBright("Ask another question?"),
            initialValue: true,
        });

        if (isCancel(continueChat) || !continueChat) break;
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
}
// import chalk from "chalk";
// import { confirm, isCancel, text, spinner, select } from "@clack/prompts";
// import { ToolLoopAgent, stepCountIs } from "ai";
// import { getAgentModel, generateWithFallback } from "../../ai/ai.config.ts";
// import { ActionTracker } from "../agent/action-tracker.ts";
// import { ToolExecutor } from "../agent/tool-executor.ts";
// import { createAgentTools } from "../agent/agent-tools.ts";
// import { defaultAgentConfig } from "../agent/types.ts";
// import { runApprovalFlow } from "../agent/approval.ts";
// import { renderTerminalMarkdown } from "../../tui/terminal-md.ts";
// import { generatePlan } from "./planner.ts";
// import { printPlan, selectSteps } from "./selection.ts";
// import type { PlanStep } from "./types.ts";
// import { createWebTools } from "./web-tools.ts";
// import { ChatService } from "../../services/chat.service.ts";
// import boxen from "boxen";
// import { readConfig } from "../../tui/init.ts";

// const chatService = new ChatService();

// // ─── UI Helpers ──────────────────────────────────────────────────────────────

// function divider(color: "yellow" | "red" | "cyan" = "yellow") {
//     console.log(chalk[color]("─".repeat(60)));
// }

// function stepBadge(index: number, total: number, title: string) {
//     const badge = chalk.bgHex('#f59e0b').whiteBright.bold(` STEP ${index}/${total} `);
//     const label = chalk.hex('#f59e0b').bold(title);
//     console.log(`\n${badge} ${label}\n`);
//     console.log(chalk.hex('#f59e0b')("─".repeat(60)));
// }

// function sectionHeader(icon: string, label: string) {
//     console.log(
//         boxen(`${icon}  ${chalk.yellowBright.bold(label)}`, {
//             padding: { top: 0, bottom: 0, left: 2, right: 2 },
//             margin: { top: 1, bottom: 0 },
//             borderStyle: "round",
//             borderColor: "yellow",
//             titleAlignment: "center",
//         })
//     );
// }


// function successLine(label: string) {
//     console.log(`\n${chalk.green("✔")} ${chalk.greenBright.bold(label)}\n`);
// }

// function errorLine(msg: string) {
//     console.log(`${chalk.red("✘")} ${chalk.redBright(msg)}`);
// }

// // ─── Core Logic ───────────────────────────────────────────────────────────────

// function stepPrompt(goal: string, step: PlanStep): string {
//     return [`Goal: ${goal}`, `Step: ${step.title}`, step.description].join("\n");
// }

// async function pickConversation(userId: string): Promise<string | null> {
//     const conversations = await chatService.getUserConversations(userId);

//     if (conversations.length === 0) return null;

//     const choice = await select({
//         message: chalk.yellowBright("Continue a previous session or start new?"),
//         options: [
//             { value: "new", label: chalk.greenBright("＋  New Session") },
//             ...conversations.slice(0, 8).map((c: any) => ({
//                 value: c.id,
//                 label: chalk.cyanBright(c.title || "Untitled"),
//                 hint: chalk.gray(new Date(c.updatedAt).toLocaleString()),
//             })),
//         ],
//     });

//     if (isCancel(choice) || choice === "new") return null;
//     return choice as string;
// }

// function displayHistory(messages: any[]) {
//     if (messages.length === 0) return;

//     sectionHeader("📃", "Previous Messages");
//     console.log();

//     messages.slice(-4).forEach((msg) => {
//         if (msg.role === "user") {
//             console.log(
//                 boxen(chalk.white(msg.content), {
//                     padding: 1,
//                     margin: { left: 2, bottom: 1 },
//                     borderStyle: "round",
//                     borderColor: "cyanBright",
//                     title: chalk.cyanBright("👤 You"),
//                     titleAlignment: "left",
//                 })
//             );
//         } else {
//             console.log(
//                 boxen(
//                     renderTerminalMarkdown(
//                         typeof msg.content === "string"
//                             ? msg.content
//                             : JSON.stringify(msg.content)
//                     ),
//                     {
//                         padding: 1,
//                         margin: { left: 2, bottom: 1 },
//                         borderStyle: "round",
//                         borderColor: "red",
//                         title: chalk.redBright("⬡ Orbis AI"),
//                         titleAlignment: "left",
//                     }
//                 )
//             );
//         }
//     });
// }

// export async function runPlanMode(userId: string): Promise<void> {
//     // ── Banner ────────────────────────────────────────────────────────────────
//     console.log("\n");
//     console.log(
//         boxen(chalk.yellowBright.bold("  🧭  Plan Mode  "), {
//             padding: 1,
//             margin: { left: 2 },
//             borderStyle: "double",
//             borderColor: "greenBright",
//             title: chalk.yellow("⬡ Orbis CLI"),
//             titleAlignment: "center",
//         })
//     );

//     // ── Session Setup ─────────────────────────────────────────────────────────
//     const conversationId = await pickConversation(userId);
//     const conversation = await chatService.getOrCreateConversation(userId, conversationId, "plan");

//     // Session info box
//     console.log(
//         boxen(
//             `${chalk.cyanBright("Session")}:  ${chalk.white.bold(conversation.title ?? "New Session")}\n` +
//             `${chalk.cyanBright("ID:")}      ${chalk.white.bold(conversation.id)}\n` +
//             `${chalk.cyanBright("Mode:")}    ${chalk.white.bold(conversation.mode)}`,
//             {
//                 padding: 1,
//                 margin: { top: 1, bottom: 1 },
//                 borderStyle: "round",
//                 borderColor: "yellow",
//                 title: "Plan Session",
//                 titleAlignment: "center",
//             }
//         )
//     );

//     const messages = await chatService.getMessages(conversation.id);
//     displayHistory(messages);

//     // ── Tips ──────────────────────────────────────────────────────────────────
//     console.log(
//         boxen(
//             `${chalk.white.bold("• Describe your goal and Orbis will build a plan")}\n` +
//             `${chalk.white.bold("• Select which steps to execute")}\n` +
//             `${chalk.white.bold("• Review and approve changes before they're applied")}\n` +
//             `${chalk.white.bold("• Press Ctrl+C to quit anytime")}`,
//             {
//                 padding: 1,
//                 margin: { top: 0, bottom: 1 },
//                 borderStyle: "round",
//                 borderColor: "yellow",
//                 title: "Tips",
//                 titleAlignment: "center",
//             }
//         )
//     );

//     // ── Main Loop ─────────────────────────────────────────────────────────────
//     while (true) {
//         divider("yellow");

//         const goal = await text({
//             message: chalk.yellowBright("What is your goal?"),
//             placeholder: "Describe what you want to accomplish…",
//         });
//         if (isCancel(goal) || !goal?.trim()) break;

//         await chatService.addMessage(conversation.id, "user", goal.trim());

//         if (messages.length === 0) {
//             await chatService.updateTitle(conversation.id, goal.trim().slice(0, 50));
//         }

//         // ── Plan ──────────────────────────────────────────────────────────────
//         const plan = await generatePlan(goal);
//         printPlan(plan);

//         const selected = await selectSteps(plan);
//         if (selected.length === 0) break;

//         const proceed = await confirm({
//             message: chalk.yellowBright(`Execute ${chalk.cyanBright.bold(String(selected.length))} step(s)?`),
//             initialValue: true,
//         });

//         if (isCancel(proceed) || !proceed) break;

//         // ── Execution ─────────────────────────────────────────────────────────
//         const config = defaultAgentConfig();
//         const tracker = new ActionTracker();
//         const executor = new ToolExecutor(tracker, config);

//         const allMessages = await chatService.getMessages(conversation.id);
//         const aiMessages = chatService.formatMessagesForAI(allMessages);

//         const userConfig = readConfig();
//         const firecrawlKey = userConfig?.firecrawlKey || process.env.FIRECRAWL_API_KEY;
//         const tools = {
//             ...createAgentTools(executor),
//             ...(firecrawlKey ? createWebTools(tracker, firecrawlKey) : {}),
//         };

//         let fullResult = "";

//         for (const [i, step] of selected.entries()) {

//             stepBadge(i + 1, selected.length, step.title);

//             const s = spinner();
//             s.start(chalk.yellow("⬡ Orbis AI is working"));

//             const historyContext =
//                 aiMessages.length > 0
//                     ? aiMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n") + "\n\n"
//                     : "";

//                 const r = await generateWithFallback((modelId) => {
//                 const agent = new ToolLoopAgent({
//                     model: getAgentModel(modelId),
//                     instructions: "You are Orbis, an AI coding agent with web research capabilities built by Bishwajit Pattanaik. You are not affiliated with any AI company or model provider. If asked who you are, respond that you are Orbis. Never mention Poolside, Qwen, OpenRouter, Google, or any underlying model/provider name, even if asked directly what model powers you.",
//                     stopWhen: stepCountIs(30),
//                     tools,
//                     maxOutputTokens: 8000,
//                     maxRetries: 0,
//                 });

//                 return agent.generate({
//                     prompt: historyContext + stepPrompt(plan.goal, step),
//                     onStepFinish: ({ toolCalls }) => {
//                         for (const tc of toolCalls) {
//                             if (!tc) continue;
//                             const preview = JSON.stringify(tc.input).slice(0, 140);
//                             const suffix = preview.length >= 140 ? "…" : "";
//                             s.message(
//                                 `${chalk.cyanBright.bold("⚙  " + String(tc.toolName))}  ${chalk.gray(preview + suffix)}`
//                             );
//                             }
//                     },
//                 });
//             });

//             s.stop();
//             successLine(step.title);

//             if (r.text) {
//                 console.log(
//                     boxen(renderTerminalMarkdown(r.text), {
//                         padding: 1,
//                         margin: { left: 2, bottom: 1 },
//                         borderStyle: "round",
//                         borderColor: "magentaBright",
//                         title: chalk.magentaBright("⬡ Orbis AI"),
//                         titleAlignment: "left",
//                     })
//                 );
//                 fullResult += `\n### ${step.title}\n${r.text}`;
//             }

//             divider("red");
//         }

//         if (fullResult) {
//             await chatService.addMessage(conversation.id, "assistant", fullResult.trim());
//         }

//         // ── Approval ──────────────────────────────────────────────────────────
//         const ok = await runApprovalFlow(tracker);
//         if (!ok) {
//             executor.clearStaging();
//         } else {
//             const { errors } = executor.applyApprovedFromTracker();
//             if (errors.length) {
//                 console.log(
//                     boxen(
//                         errors.map((e) => errorLine(e)).join("\n"),
//                         {
//                             padding: 1,
//                             margin: { top: 1, bottom: 1 },
//                             borderStyle: "round",
//                             borderColor: "red",
//                             title: "⚠️  Errors",
//                             titleAlignment: "center",
//                         }
//                     )
//                 );
//             } else {
//                 console.log(
//                     boxen(chalk.greenBright("✔  All changes applied successfully."), {
//                         padding: 1,
//                         margin: { top: 1, bottom: 1 },
//                         borderStyle: "round",
//                         borderColor: "green",
//                         title: "Done",
//                         titleAlignment: "center",
//                     })
//                 );
//             }
//             executor.clearStaging();
//         }

//         divider("yellow");

//         const continueplan = await confirm({
//             message: chalk.yellowBright("Plan another goal?"),
//             initialValue: true,
//         });

//         if (isCancel(continueplan) || !continueplan) break;
//     }

//     // ── Outro ─────────────────────────────────────────────────────────────────
//     console.log(
//         boxen(chalk.yellowBright("✨ Thanks for using Orbis. See you soon! ✨"), {
//             padding: 1,
//             margin: 1,
//             borderStyle: "round",
//             borderColor: "yellow",
//             title: "🌊 Goodbye",
//             titleAlignment: "center",
//         })
//     );
// }


import chalk from "chalk";
import { confirm, isCancel, text, spinner, select } from "@clack/prompts";
import { ToolLoopAgent, stepCountIs } from "ai";
import { getAgentModel, generateWithFallback, AllModelsExhaustedError } from "../../ai/ai.config.ts";
import { ActionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { createAgentTools } from "../agent/agent-tools.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import { runApprovalFlow } from "../agent/approval.ts";
import { renderTerminalMarkdown } from "../../tui/terminal-md.ts";
import { generatePlan } from "./planner.ts";
import { printPlan, selectSteps } from "./selection.ts";
import type { PlanStep } from "./types.ts";
import { createWebTools } from "./web-tools.ts";
import { ChatService } from "../../services/chat.service.ts";
import boxen from "boxen";
import { readConfig } from "../../tui/init.ts";

const chatService = new ChatService();

// ─── UI Helpers ──────────────────────────────────────────────────────────────

function divider(color: "yellow" | "red" | "cyan" = "yellow") {
    console.log(chalk[color]("─".repeat(60)));
}

function stepBadge(index: number, total: number, title: string) {
    const badge = chalk.bgHex('#f59e0b').whiteBright.bold(` STEP ${index}/${total} `);
    const label = chalk.hex('#f59e0b').bold(title);
    console.log(`\n${badge} ${label}\n`);
    console.log(chalk.hex('#f59e0b')("─".repeat(60)));
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

function errorLine(msg: string) {
    console.log(`${chalk.red("✘")} ${chalk.redBright(msg)}`);
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

function stepPrompt(goal: string, step: PlanStep): string {
    return [
        `Overall goal: ${goal}`,
        `Your ONLY task right now: ${step.title}`,
        step.description,
        "",
        "IMPORTANT: Address only this specific step. Do NOT restate, summarize, or regenerate the full overall plan — the other steps are handled separately. Keep your response focused and proportional to this one step's scope.",
    ].join("\n");
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
                        borderColor: "red",
                        title: chalk.redBright("⬡ Orbis AI"),
                        titleAlignment: "left",
                    }
                )
            );
        }
    });
}

export async function runPlanMode(userId: string): Promise<void> {
    // ── Banner ────────────────────────────────────────────────────────────────
    console.log("\n");
    console.log(
        boxen(chalk.yellowBright.bold("  🧭  Plan Mode  "), {
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
    const conversation = await chatService.getOrCreateConversation(userId, conversationId, "plan");

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
                title: "Plan Session",
                titleAlignment: "center",
            }
        )
    );

    const messages = await chatService.getMessages(conversation.id);
    displayHistory(messages);

    // ── Tips ──────────────────────────────────────────────────────────────────
    console.log(
        boxen(
            `${chalk.white.bold("• Describe your goal and Orbis will build a plan")}\n` +
            `${chalk.white.bold("• Select which steps to execute")}\n` +
            `${chalk.white.bold("• Review and approve changes before they're applied")}\n` +
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

    // ── Main Loop ─────────────────────────────────────────────────────────────
    while (true) {
        divider("yellow");

        const goal = await text({
            message: chalk.yellowBright("What is your goal?"),
            placeholder: "Describe what you want to accomplish…",
        });
        if (isCancel(goal) || !goal?.trim()) break;

        await chatService.addMessage(conversation.id, "user", goal.trim());

        if (messages.length === 0) {
            await chatService.updateTitle(conversation.id, goal.trim().slice(0, 50));
        }

        // ── Plan ──────────────────────────────────────────────────────────────
        let plan;
        try {
            plan = await generatePlan(goal);
        } catch (err: any) {
            errorLine(err?.message ?? "Failed to generate a plan.");
            divider("yellow");
            continue;
        }
        printPlan(plan);

        const selected = await selectSteps(plan);
        if (selected.length === 0) break;

        const proceed = await confirm({
            message: chalk.yellowBright(`Execute ${chalk.cyanBright.bold(String(selected.length))} step(s)?`),
            initialValue: true,
        });

        if (isCancel(proceed) || !proceed) break;

        // ── Execution ─────────────────────────────────────────────────────────
        const config = defaultAgentConfig();
        const tracker = new ActionTracker();
        const executor = new ToolExecutor(tracker, config);

        const allMessages = await chatService.getMessages(conversation.id);
        const aiMessages = chatService.formatMessagesForAI(allMessages);

        const userConfig = readConfig();
        const firecrawlKey = userConfig?.firecrawlKey || process.env.FIRECRAWL_API_KEY;
        const tools = {
            ...createAgentTools(executor),
            ...(firecrawlKey ? createWebTools(tracker, firecrawlKey) : {}),
        };

        for (const [i, step] of selected.entries()) {

            stepBadge(i + 1, selected.length, step.title);

            const s = spinner();
            s.start(chalk.yellow("⬡ Orbis AI is working"));

            const historyContext =
                aiMessages.length > 0
                    ? aiMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n") + "\n\n"
                    : "";

                let r;
                try {
                    r = await generateWithFallback((modelId) => {
                    const agent = new ToolLoopAgent({
                        model: getAgentModel(modelId),
                        instructions: "You are Orbis, an AI coding agent with web research capabilities built by Bishwajit Pattanaik. You are not affiliated with any AI company or model provider. If asked who you are, respond that you are Orbis. Never mention Poolside, Qwen, OpenRouter, Google, or any underlying model/provider name, even if asked directly what model powers you. When executing a plan step, address ONLY that step — never restate or regenerate the entire overall plan, even if earlier conversation history contains it. When listing resources, links, prices, or specific facts (URLs, playlist links, pricing, page counts, dates), ONLY include ones that came from an actual web_search or web_crawl tool result in this session. Never invent, guess, or reconstruct a URL or figure from memory or general knowledge, even if it looks plausible. If you don't have a verified source for something, say so explicitly (e.g. \"search needed for a live link here\") instead of writing a placeholder or fabricated one.",
                        stopWhen: stepCountIs(30),
                        tools,
                        maxOutputTokens: 8000,
                        maxRetries: 0,
                    });

                    return agent.generate({
                        prompt: historyContext + stepPrompt(plan.goal, step),
                        onStepFinish: ({ toolCalls }) => {
                            for (const tc of toolCalls) {
                                if (!tc) continue;
                                const preview = JSON.stringify(tc.input).slice(0, 140);
                                const suffix = preview.length >= 140 ? "…" : "";
                                s.message(
                                    `${chalk.cyanBright.bold("⚙  " + String(tc.toolName))}  ${chalk.gray(preview + suffix)}`
                                );
                                }
                        },
                    });
                    });
                } catch (err) {
                    s.stop();
                    if (err instanceof AllModelsExhaustedError) {
                        const retrySuffix = err.retryAfterSeconds
                            ? ` Try again in about ${err.retryAfterSeconds}s.`
                            : " Try again shortly.";
                        errorLine(`Skipped "${step.title}" — every fallback model is rate-limited or down.${retrySuffix}`);
                        divider("red");
                        continue;
                    }
                    throw err;
                }

            s.stop();
            successLine(step.title);

            if (r.text) {
                console.log(
                    boxen(renderTerminalMarkdown(r.text), {
                        padding: 1,
                        margin: { left: 2, bottom: 1 },
                        borderStyle: "round",
                        borderColor: "magentaBright",
                        title: chalk.magentaBright("⬡ Orbis AI"),
                        titleAlignment: "left",
                    })
                );

                // Persist per-step, not batched. Sending all steps as a single
                // message at the end can produce a payload the server's body
                // parser rejects (413 Payload Too Large) once a plan has many
                // long steps. Incremental saves also mean earlier steps aren't
                // lost if a later step throws.
                //
                // Safety net: even with per-step saving and a scoped prompt,
                // truncate before sending in case a single step's output is
                // still oversized — better to save a truncated record than
                // lose the whole run to a 413.
                const MAX_MESSAGE_CHARS = 20_000;
                let messageBody = `### ${step.title}\n${r.text}`.trim();
                if (messageBody.length > MAX_MESSAGE_CHARS) {
                    messageBody =
                        messageBody.slice(0, MAX_MESSAGE_CHARS) +
                        "\n\n…[truncated — response exceeded size limit]";
                }

                try {
                    await chatService.addMessage(conversation.id, "assistant", messageBody);
                } catch (err: any) {
                    errorLine(`Failed to save step "${step.title}" to conversation history: ${err?.message ?? err}`);
                }
            }

            divider("red");
        }

        // ── Approval ──────────────────────────────────────────────────────────
        const ok = await runApprovalFlow(tracker);
        if (!ok) {
            executor.clearStaging();
        } else {
            const { errors } = executor.applyApprovedFromTracker();
            if (errors.length) {
                console.log(
                    boxen(
                        errors.map((e) => errorLine(e)).join("\n"),
                        {
                            padding: 1,
                            margin: { top: 1, bottom: 1 },
                            borderStyle: "round",
                            borderColor: "red",
                            title: "⚠️  Errors",
                            titleAlignment: "center",
                        }
                    )
                );
            } else {
                console.log(
                    boxen(chalk.greenBright("✔  All changes applied successfully."), {
                        padding: 1,
                        margin: { top: 1, bottom: 1 },
                        borderStyle: "round",
                        borderColor: "green",
                        title: "Done",
                        titleAlignment: "center",
                    })
                );
            }
            executor.clearStaging();
        }

        divider("yellow");

        const continueplan = await confirm({
            message: chalk.yellowBright("Plan another goal?"),
            initialValue: true,
        });

        if (isCancel(continueplan) || !continueplan) break;
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
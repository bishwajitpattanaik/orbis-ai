import chalk from "chalk";
import { select, isCancel, note } from "@clack/prompts";
import { runAgentMode } from "./agent/orchestrator";
import { runAskMode } from "./ask/orchestrator";
import { runPlanMode } from "./plan/orchestrator";
import { readConfig, runInit } from "../tui/init";

export async function runCliMode(userId: string) {
    let config = readConfig();

    if (!config?.setupComplete) {
        note("Let's get you set up first.", "Welcome to Orbis");
        await runInit();
        config = readConfig();
    }

    if (!config?.setupComplete) return;

    while (true) {
        const mode = await select({
            message: "Choose CLI sub-mode",
            options: [
                { value: "ask", label: "Ask Mode" },
                { value: "agent", label: "Agent Mode" },
                { value: "plan", label: "Plan Mode" },
                { value: "back", label: "← Back to main menu" },
            ],
        });

        if (isCancel(mode) || mode === "back") return;

        if (mode === "agent") await runAgentMode(userId);
        if (mode === "ask") await runAskMode(userId);
        if (mode === "plan") await runPlanMode(userId);
    }
}
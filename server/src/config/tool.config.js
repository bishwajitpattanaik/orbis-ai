import { google } from "@ai-sdk/google";
import chalk from "chalk";

export const availableTools = [
    {
        id: "google_search",
        name: "Google Search",
        description: "Access the latest information using Google Search. useful for current Events, News and Real-Time Information.",
        getTool: () => google.tools.googleSearchTool({}),
        enabled: false,
    },
    {
        id: "code_execution",
        name: "Code Execution",
        description: "Generate and execute any code to perform calculations, solve problems, or provide accurate information.",
        getTool: () => google.tools.codeExecution({}),
        enabled: false,
    },
    {
        id: "url_context",
        name: "URL Context",
        description: "Provide specific URLs that you want the model to analyze directly from the prompt. Supports up to 20 URLs per request.",
        getTool: () => google.tools.urlContext({}),
        enabled: false,
    },
];


export function getEnabledTools() {
    const tools = {};

    for (const toolConfig of availableTools) {
        if (toolConfig.enabled) {
            try {
                tools[toolConfig.id] = toolConfig.getTool();
            } catch (error) {
                // Silently skip tools that fail to initialize
                // The app will continue working with other available tools
            }
        }
    }

    return Object.keys(tools).length > 0 ? tools : undefined;
}


export function toggleTool(toolId) {
    const tool = availableTools.find(t => t.id === toolId);

    if (tool) {
        tool.enabled = !tool.enabled;
        console.log(chalk.gray(`[DEBUG] Tool ${toolId} toggled to ${tool.enabled}`));

        return tool.enabled;
    }

    console.log(chalk.red(`[DEBUG] Tool ${toolId} not found`));

    return false;
}

export function enableTools(toolIds) {
    console.log(chalk.gray('[DEBUG] EnableTools called with:'), toolIds);

    availableTools.forEach(tool => {
        const wasEnabled = tool.enabled;
        tool.enabled = toolIds.includes(tool.id);

        if (tool.enabled !== wasEnabled) {
            console.log(chalk.gray(`[DEBUG] ${tool.id}: ${wasEnabled} -> ${tool.enabled}`));
        }
    });

    const enabledCount = availableTools.filter(t => t.enabled).length;
    console.log(chalk.gray(`[DEBUG] Total Tools Enabled: ${enabledCount}/${availableTools.length}`));
}

export function getEnabledToolNames() {
    const names = availableTools.filter(t => t.enabled).map(t => t.name);
    console.log(chalk.gray('[DEBUG] Get Enabled Tool Names Returning:'), names);
    return names;
}

export function resetTools() {
    availableTools.forEach(tool => {
        tool.enabled = false;
    });
    console.log(chalk.gray('[DEBUG] All tools have been reset (disabled).'));
}
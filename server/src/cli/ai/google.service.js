// Global Imports
import { google } from "@ai-sdk/google";
import { convertToModelMessages, generateObject, streamText } from "ai";
import chalk from "chalk";

// Local Imports
import { config } from "../../config/google.config.js";

export class AIService {
    constructor() {
        if (!config.googleApiKey) {
            throw new Error(chalk.red("Google API key is not set. Please set the GOOGLE_API_KEY env."));
        }

        this.model = google(config.model, {
            apiKey: config.googleApiKey,
        })
    }


    /**
     * Send a message and get streaming response
     * @param {Array} messages
     * @param {Function} onChunk
     * @param {Object} tools
     * @param {Function} onToolCall
     * @returns {Promise<Object>}

     */

    async sendMessage(messages, onChunk, tools = undefined, onToolCall = null) {
        try {
            const streamConfig = {
                model: this.model,
                messages: messages,
            }

            if (tools && Object.keys(tools).length > 0) {
                streamConfig.tools = tools;
                streamConfig.maxSteps = 5; // Allow up to 5 tool call steps

                console.log(chalk.gray(`[DEBUG] Tools Enabled: ${Object.keys(tools).join(',')}`));
            }

            const result = streamText(streamConfig);

            let fullResponse = "";

            for await (const chunk of result.textStream) {
                fullResponse += chunk;
                if (onChunk) {
                    onChunk(chunk);
                }
            }

            const fullResult = result;

            const toolCalls = [];
            const toolResults = [];

            if (fullResult.steps && Array.isArray(fullResult.steps)) {
                for (const step of fullResult.steps) {
                    if (step.toolCalls && step.toolCalls.length > 0) {
                        for (const toolCall of step.toolCalls) {
                            toolCalls.push(toolCall);

                            if (onToolCall) {
                                onToolCall(toolCall);
                            }
                        }
                    }

                    if (step.toolResults && step.toolResults.length > 0) {
                        toolResults.push(...step.toolResults);
                    }
                }
            }

            return {
                content: fullResponse,
                finishResponse: fullResult.finishReason,
                usage: fullResult.usage,
                toolCalls,
                toolResults,
                steps: fullResult.steps
            }
        } catch (error) {
            console.error(chalk.red("AI Service Error:"), error.messages);
            throw error;
        }
    }

    /**
     * Get a non-streaming response
     * @param {Array} messages - Array of message objects
     * @param {Object} tools - Optional tools for the AI to use
     * @returns {Promise<string>} Response text
     */

    async getMessage(messages, tools = undefined) {
        let fullResponse = "";
        const result = await this.sendMessage(messages, (chunk) => {
            fullResponse += chunk;
        }, tools);

        return result.content;
    }


    /**
     * Generate structured output using a zod schema
     * @param {Object} schema - Zod Schema
     * @param {string} prompt for generation
     * @returns {Promise<Object>} Parsed object matching the schema
     */

    async generateStructured(schema, prompt) {
        try {
            const result = await generateObject({
                model: this.model,
                schema: schema,
                prompt: prompt
            })

            return result.object;
        } catch (error) {
            console.error(chalk.red("AI Service Structured Generation Error:"), error.messages);
            throw error;
        }
    }
}
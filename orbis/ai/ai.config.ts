import dotenv from "dotenv";
dotenv.config();

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { readConfig } from "../tui/init";

const FREE_FALLBACK_MODELS: string[] = [
  "openrouter/free",          // auto-router: always resolves to a live free model
  "qwen/qwen3-coder:free",    // confirmed real, good for tool use
  "poolside/laguna-xs-2:free", // confirmed real, agentic coding, tool calling
];

export function getAgentModel(modelId?: string) {
  const config = readConfig();

  const provider = config?.defaultModel === "gemini"
    ? createGoogleGenerativeAI({ apiKey: config.geminiKey })
    : createOpenRouter({ apiKey: config?.openrouterKey ?? process.env.OPENROUTER_API_KEY });

  if (config?.defaultModel === "gemini") {
    return (provider as ReturnType<typeof createGoogleGenerativeAI>)("gemini-2.0-flash");
  }

  const resolvedModelId: string =
    modelId ||
    config?.openrouterModelId ||
    process.env.OPENROUTER_DEFAULT_MODEL ||
    FREE_FALLBACK_MODELS[0]!;

  return (provider as ReturnType<typeof createOpenRouter>)(resolvedModelId);
}

export function getFallbackModelIds(): string[] {
  const config = readConfig();
  const primary = config?.openrouterModelId || FREE_FALLBACK_MODELS[0]!;

  const rest = FREE_FALLBACK_MODELS.filter((id) => id !== primary);
  return [primary, ...rest];
}

function isRateLimitedError(err: any): boolean {
  if (err?.statusCode === 429 || err?.statusCode === 402) return true;
  if (err?.name === "AI_RetryError" && Array.isArray(err?.errors)) {
    return err.errors.some(
      (e: any) => e?.statusCode === 429 || e?.statusCode === 402
    );
  }
  return false;
}

export async function generateWithFallback<T>(
  fn: (modelId: string) => Promise<T>
): Promise<T> {
  const modelIds = getFallbackModelIds();
  let lastError: unknown;

  for (const modelId of modelIds) {
    try {
      return await fn(modelId);
    } catch (err: any) {
      lastError = err;
      if (!isRateLimitedError(err)) throw err;
      console.warn(`⚠ ${modelId} unavailable, trying next fallback model…`);
    }
  }

  throw lastError;
}
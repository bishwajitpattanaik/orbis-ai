// import dotenv from "dotenv";
// dotenv.config();

// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
// import { createGoogleGenerativeAI } from "@ai-sdk/google";
// import { readConfig } from "../tui/init";

// const FREE_FALLBACK_MODELS: string[] = [
//   "openai/gpt-oss-120b:free",
//   "google/gemma-4-26b-a4b-it:free",
//   "cohere/north-mini-code:free",
// ];

// export function getAgentModel(modelId?: string) {
//   const config = readConfig();

//   const provider = config?.defaultModel === "gemini"
//     ? createGoogleGenerativeAI({ apiKey: config.geminiKey })
//     : createOpenRouter({ apiKey: config?.openrouterKey ?? process.env.OPENROUTER_API_KEY });

//   if (config?.defaultModel === "gemini") {
//     return (provider as ReturnType<typeof createGoogleGenerativeAI>)("gemini-2.0-flash");
//   }

//   const resolvedModelId: string =
//     modelId ||
//     config?.openrouterModelId ||
//     process.env.OPENROUTER_DEFAULT_MODEL ||
//     FREE_FALLBACK_MODELS[0]!;

//   return (provider as ReturnType<typeof createOpenRouter>)(resolvedModelId);
// }

// export function getFallbackModelIds(): string[] {
//   const config = readConfig();
//   const primary = config?.openrouterModelId || FREE_FALLBACK_MODELS[0]!;

//   const rest = FREE_FALLBACK_MODELS.filter((id) => id !== primary);
//   return [primary, ...rest];
// }

// function isRateLimitedError(err: any): boolean {
//   if (err?.statusCode === 429 || err?.statusCode === 402) return true;
//   if (err?.name === "AI_RetryError" && Array.isArray(err?.errors)) {
//     return err.errors.some(
//       (e: any) => e?.statusCode === 429 || e?.statusCode === 402
//     );
//   }
//   return false;
// }

// function isMalformedOutputError(err: any): boolean {
//   if (err?.name === "AI_NoObjectGeneratedError") return true;
//   if (err?.name === "AI_JSONParseError") return true;
//   if (err?.vercel?.ai?.error?.AI_JSONParseError === true) return true;
//   if (err?.name === "AI_RetryError" && Array.isArray(err?.errors)) {
//     return err.errors.some(
//       (e: any) =>
//         e?.name === "AI_NoObjectGeneratedError" || e?.name === "AI_JSONParseError"
//     );
//   }
//   return false;
// }

// export async function generateWithFallback<T>(
//   fn: (modelId: string) => Promise<T>
// ): Promise<T> {
//   const modelIds = getFallbackModelIds();
//   let lastError: unknown;

//   for (const modelId of modelIds) {
//     try {
//       return await fn(modelId);
//     } catch (err: any) {
//       lastError = err;
//       if (!isRateLimitedError(err) && !isMalformedOutputError(err)) throw err;
//       console.warn(`⚠ ${modelId} unavailable, trying next fallback model…`);
//     }
//   }

//   throw lastError;
// }

import dotenv from "dotenv";
dotenv.config();

import type { LanguageModel } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createCerebras } from "@ai-sdk/cerebras";
import { readConfig } from "../tui/init";

const FREE_FALLBACK_MODELS: string[] = [
  "openai/gpt-oss-120b:free",
  "google/gemma-4-26b-a4b-it:free",
  "cohere/north-mini-code:free",
];

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const CEREBRAS_MODEL = "gpt-oss-120b";

// Thrown when every model in the fallback chain has failed. Callers should
// catch this specifically to show a clean "try again shortly" message
// instead of letting the raw provider error (often a giant stack dump)
// crash the CLI.
export class AllModelsExhaustedError extends Error {
  readonly retryAfterSeconds?: number;
  readonly lastError: unknown;

  constructor(lastError: unknown) {
    const retryAfterSeconds = extractRetryAfterSeconds(lastError);
    const suffix = retryAfterSeconds
      ? ` Retry in about ${retryAfterSeconds}s.`
      : "";
    super(`All fallback models are currently unavailable.${suffix}`);
    this.name = "AllModelsExhaustedError";
    this.retryAfterSeconds = retryAfterSeconds;
    this.lastError = lastError;
  }
}

function extractRetryAfterSeconds(err: any): number | undefined {
  const headerVal =
    err?.responseHeaders?.["retry-after"] ??
    err?.data?.responseHeaders?.["retry-after"];
  if (headerVal && !Number.isNaN(Number(headerVal))) {
    return Number(headerVal);
  }
  if (err?.name === "AI_RetryError" && Array.isArray(err?.errors)) {
    for (const e of err.errors) {
      const h = e?.responseHeaders?.["retry-after"];
      if (h && !Number.isNaN(Number(h))) return Number(h);
    }
  }
  return undefined;
}

// Models that don't reliably support forced tool_choice — used by callers
// (e.g. planner.ts) to relax toolChoice from "required" to "auto" for these.
export function isDirectProviderModel(modelId: string): boolean {
  return modelId === GROQ_MODEL || modelId === CEREBRAS_MODEL;
}

// Groq's llama-3.3-70b-versatile rejects response_format: json_schema outright
// (400 "This model does not support response format `json_schema`").
// Callers doing structured/schema-constrained generation should filter the
// chain through this before passing it to generateWithFallback.
export function supportsJsonSchema(modelId: string): boolean {
  return modelId !== GROQ_MODEL;
}

function buildProviderChain(): string[] {
  const config = readConfig();
  const primary = config?.openrouterModelId || FREE_FALLBACK_MODELS[0]!;
  const restOpenRouter = FREE_FALLBACK_MODELS.filter((id) => id !== primary);

  const chain: string[] = [primary, ...restOpenRouter];

  if (config?.groqKey) chain.push(GROQ_MODEL);
  if (config?.cerebrasKey) chain.push(CEREBRAS_MODEL);

  return chain;
}

export function getAgentModel(modelId?: string): LanguageModel {
  const config = readConfig();

  if (config?.defaultModel === "gemini") {
    const provider = createGoogleGenerativeAI({ apiKey: config.geminiKey });
    return provider("gemini-2.0-flash") as unknown as LanguageModel;
  }

  if (modelId === GROQ_MODEL) {
    return createGroq({ apiKey: config?.groqKey })(GROQ_MODEL) as unknown as LanguageModel;
  }

  if (modelId === CEREBRAS_MODEL) {
    return createCerebras({ apiKey: config?.cerebrasKey })(CEREBRAS_MODEL) as unknown as LanguageModel;
  }

  const provider = createOpenRouter({
    apiKey: config?.openrouterKey ?? process.env.OPENROUTER_API_KEY,
  });

  const resolvedModelId: string =
    modelId ||
    config?.openrouterModelId ||
    process.env.OPENROUTER_DEFAULT_MODEL ||
    FREE_FALLBACK_MODELS[0]!;

  return provider(resolvedModelId) as unknown as LanguageModel;
}

export function getFallbackModelIds(): string[] {
  return buildProviderChain();
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

function isMalformedOutputError(err: any): boolean {
  if (err?.name === "AI_NoObjectGeneratedError") return true;
  if (err?.name === "AI_JSONParseError") return true;
  if (err?.vercel?.ai?.error?.AI_JSONParseError === true) return true;
  if (err?.name === "AI_RetryError" && Array.isArray(err?.errors)) {
    return err.errors.some(
      (e: any) =>
        e?.name === "AI_NoObjectGeneratedError" || e?.name === "AI_JSONParseError"
    );
  }
  return false;
}

function isAccountWideRateLimit(err: any): boolean {
  return (
    err?.statusCode === 429 &&
    typeof err?.responseBody === "string" &&
    err.responseBody.includes("free-models-per-day")
  );
}

function isToolCallFailure(err: any): boolean {
  if (err?.statusCode === 400 && typeof err?.responseBody === "string") {
    return err.responseBody.includes("tool_use_failed");
  }
  return false;
}

// Groq: "Request too large ... tokens per minute (TPM)" — 413, request will
// never fit this model's TPM ceiling. Not transient; move on immediately.
function isRequestTooLargeError(err: any): boolean {
  if (err?.statusCode === 413) return true;
  if (typeof err?.responseBody === "string") {
    return (
      err.responseBody.includes("Request too large") ||
      err.responseBody.includes("reduce your message size")
    );
  }
  if (err?.name === "AI_RetryError" && Array.isArray(err?.errors)) {
    return err.errors.some(
      (e: any) =>
        e?.statusCode === 413 ||
        (typeof e?.responseBody === "string" &&
          (e.responseBody.includes("Request too large") ||
            e.responseBody.includes("reduce your message size")))
    );
  }
  return false;
}

// Groq: "This model does not support response format `json_schema`" — 400,
// permanent capability mismatch, not transient. Prefer filtering the model
// out via supportsJsonSchema() before calling; this is a safety net.
function isUnsupportedResponseFormatError(err: any): boolean {
  if (
    err?.statusCode === 400 &&
    typeof err?.responseBody === "string" &&
    err.responseBody.includes("does not support response format")
  ) {
    return true;
  }
  if (err?.name === "AI_RetryError" && Array.isArray(err?.errors)) {
    return err.errors.some(
      (e: any) =>
        e?.statusCode === 400 &&
        typeof e?.responseBody === "string" &&
        e.responseBody.includes("does not support response format")
    );
  }
  return false;
}

export async function generateWithFallback<T>(
  fn: (modelId: string) => Promise<T>,
  modelIds: string[] = getFallbackModelIds()
): Promise<T> {
  let lastError: unknown;

  for (const modelId of modelIds) {
    try {
      return await fn(modelId);
    } catch (err: any) {
      lastError = err;

      if (isAccountWideRateLimit(err)) {
        console.warn(`⚠ OpenRouter daily cap reached — trying next fallback…`);
        continue;
      }

      if (isToolCallFailure(err)) {
        console.warn(`⚠ ${modelId} failed to format a tool call, trying next fallback model…`);
        continue;
      }

      if (isUnsupportedResponseFormatError(err)) {
        console.warn(`⚠ ${modelId} doesn't support structured output for this call, trying next fallback model…`);
        continue;
      }

      if (isRequestTooLargeError(err)) {
        console.warn(`⚠ ${modelId} rejected request as too large, trying next fallback model…`);
        continue;
      }

      if (!isRateLimitedError(err) && !isMalformedOutputError(err)) throw err;
      console.warn(`⚠ ${modelId} unavailable, trying next fallback model…`);
    }
  }

  throw new AllModelsExhaustedError(lastError);
}
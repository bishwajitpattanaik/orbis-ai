// import {
//   Output,
//   generateText,
//   stepCountIs,
//   tool,
// } from "ai";
// import { z } from "zod";
// import chalk from "chalk";
// import { spinner } from "@clack/prompts";
// import { getAgentModel, generateWithFallback } from "../../ai/ai.config.ts";
// import { ActionTracker } from "../agent/action-tracker.ts";
// import { ToolExecutor } from "../agent/tool-executor.ts";
// import { defaultAgentConfig } from "../agent/types.ts";
// import type { Plan, PlanStep } from "./types.ts";
// import { createWebTools } from "./web-tools.ts";
// import { readConfig } from "../../tui/init.ts";

// const planSchema = z.object({
//   researchSummary: z.string().optional(),
//   steps: z
//     .array(
//       z.object({
//         title: z.string(),
//         description: z.string(),
//         hints: z.array(z.string()).optional(),
//         complexity: z.enum(["low", "medium", "high"]).optional(),
//       }),
//     )
//     .min(1)
//     .max(15),
// });

// function readOnlyTools(executor: ToolExecutor) {
//   return {
//     read_file: tool({
//       description:
//         "Read a text file from the workspace. Use a path relative to the project root.",
//       inputSchema: z.object({
//         path: z.string().describe("Relative file path"),
//       }),
//       execute: async ({ path: p }) => executor.readFile(p),
//     }),

//     list_files: tool({
//       description: "List files and directories under a path.",
//       inputSchema: z.object({
//         path: z.string(),
//         recursive: z.boolean().optional().default(false),
//       }),
//       execute: async ({ path: p, recursive }) =>
//         executor.listFiles(p, recursive),
//     }),

//     search_files: tool({
//       description:
//         'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
//       inputSchema: z.object({
//         root: z.string().describe("Directory to search, relative to root"),
//         pattern: z
//           .string()
//           .describe("Glob-like pattern using * and ** (forward slashes)"),
//         content_contains: z.string().optional(),
//       }),
//       execute: async ({ root, pattern, content_contains }) =>
//         executor.searchFiles(root, pattern, content_contains),
//     }),

//     analyze_codebase: tool({
//       description:
//         "Summarize structure: file counts, size, extensions. Read-only.",
//       inputSchema: z.object({
//         path: z.string().default("."),
//       }),
//       execute: async ({ path: p }) => executor.analyzeCodebase(p),
//     }),

//     list_skills: tool({
//       description:
//         "List absolute paths to SKILL.md files under configured skill directories (Cursor / Claude).",
//       inputSchema: z.object({}),
//       execute: async () => executor.listSkills(),
//     }),

//     read_skill: tool({
//       description:
//         "Read a SKILL.md file. Path must be absolute and under skill roots, or use a path returned by list_skills.",
//       inputSchema: z.object({
//         path: z.string(),
//       }),
//       execute: async ({ path: p }) => executor.readSkill(p),
//     }),
//   };
// }

// const PLAN_INSTRUCTIONS = (codebase: string, hasWeb: boolean) =>
//   [
//     "You are Orbis, a Plan-Mode planner. You DO NOT modify files.",
//     `Workspace: ${codebase}`,
//     "If the user's goal relates to code, the workspace, or this project, use read-only tools to research it.",
//     "If the user's goal is unrelated to code (e.g. general research, travel, writing, etc.), don't force codebase steps — plan directly around the goal using whatever tools actually apply.",
//     hasWeb
//       ? "Web tools are available (web_search/web_crawl/fetch_url). Use them for anything requiring current or external information."
//       : "Web tools are unavailable (no FIRECRAWL_API_KEY) — for goals needing external/current information, say so plainly in researchSummary rather than substituting irrelevant codebase steps.",
//     "Output must match the provided JSON schema.",
//     "Keep it short: 1–15 steps.",
//   ].join("\n");

// export async function generatePlan(goal: string) {
//   const config = defaultAgentConfig();
//   const tracker = new ActionTracker();
//   const executor = new ToolExecutor(tracker, config);

//   const userConfig = readConfig();
//   const firecrawlKey = userConfig?.firecrawlKey || process.env.FIRECRAWL_API_KEY;
//   const hasWeb = !!firecrawlKey;
//   const tools = { ...readOnlyTools(executor), ...(hasWeb ? createWebTools(tracker, firecrawlKey) : {}) };

//   const s = spinner();
//   s.start("Researching & drafting a plan");

//   const result = await generateWithFallback((modelId) => {
//     return generateText({
//       model: getAgentModel(modelId),
//       tools,
//       stopWhen: stepCountIs(20),
//       system: PLAN_INSTRUCTIONS(config.codebasePath, hasWeb),
//       prompt: `User goal: \n${goal}`,
//       output: Output.object({ schema: planSchema }),
//       maxOutputTokens: 8000,
//       maxRetries: 0,
//     });
//   });

//   s.stop(chalk.green("✓ Plan ready."));

//   const validated = planSchema.parse(result.output);

//   const steps: PlanStep[] = validated.steps.map((s, i) => ({
//     id: `step-${i + 1}`,
//     title: s.title,
//     description: s.description,
//     hints: s.hints,
//     complexity: s.complexity,
//   }));

//   return { goal, researchSummary: validated.researchSummary, steps };
// }

import {
  Output,
  generateText,
  stepCountIs,
  tool,
} from "ai";
import { z } from "zod";
import chalk from "chalk";
import { spinner } from "@clack/prompts";
import {
  getAgentModel,
  generateWithFallback,
  getFallbackModelIds,
  isDirectProviderModel,
  supportsJsonSchema,
  AllModelsExhaustedError,
} from "../../ai/ai.config.ts";
import { ActionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import type { Plan, PlanStep } from "./types.ts";
import { createWebTools } from "./web-tools.ts";
import { readConfig } from "../../tui/init.ts";

const planSchema = z.object({
  researchSummary: z.string().optional(),
  steps: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      hints: z.array(z.string()).optional(),
      complexity: z.enum(["low", "medium", "high"]).optional(),
    }),
  ),
  // Note: intentionally no .min()/.max() on the array above — Zod compiles
  // those to JSON Schema `minItems`/`maxItems`, which Cerebras's
  // response_format validator rejects with
  // "Invalid fields for schema with types ['array']: {'minItems', 'maxItems'}".
  // Bounds are enforced manually below after parsing instead.
});

function readOnlyTools(executor: ToolExecutor) {
  return {
    read_file: tool({
      description:
        "Read a text file from the workspace. Use a path relative to the project root.",
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
      execute: async ({ path: p, recursive }) =>
        executor.listFiles(p, recursive),
    }),

    search_files: tool({
      description:
        'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
      inputSchema: z.object({
        root: z.string().describe("Directory to search, relative to root"),
        pattern: z
          .string()
          .describe("Glob-like pattern using * and ** (forward slashes)"),
        content_contains: z.string().optional(),
      }),
      execute: async ({ root, pattern, content_contains }) =>
        executor.searchFiles(root, pattern, content_contains),
    }),

    analyze_codebase: tool({
      description:
        "Summarize structure: file counts, size, extensions. Read-only.",
      inputSchema: z.object({
        path: z.string().default("."),
      }),
      execute: async ({ path: p }) => executor.analyzeCodebase(p),
    }),

    list_skills: tool({
      description:
        "List absolute paths to SKILL.md files under configured skill directories (Cursor / Claude).",
      inputSchema: z.object({}),
      execute: async () => executor.listSkills(),
    }),

    read_skill: tool({
      description:
        "Read a SKILL.md file. Path must be absolute and under skill roots, or use a path returned by list_skills.",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path: p }) => executor.readSkill(p),
    }),
  };
}

// Broad and deliberately over-inclusive: a false positive just means the
// (cheap) codebase tool schemas get sent for a non-code goal — mildly
// wasteful. A false negative means a real coding task loses access to
// read_file/list_files/search_files/analyze_codebase/list_skills/read_skill
// entirely, which breaks the task. Bias toward "include" whenever unsure.
function looksCodeRelated(goal: string): boolean {
  const g = goal.toLowerCase();

  const patterns: RegExp[] = [
    // Generic dev vocabulary
    /\b(code|codebase|repo|repository|file|files|folder|directory|function|method|class|variable|constant|module|package|library|dependency|dependencies)\b/,
    /\b(bug|bugs|error|errors|exception|crash|traceback|stack trace|debug|debugging|fix|patch|hotfix)\b/,
    /\b(refactor|refactoring|optimi[sz]e|optimi[sz]ation|clean\s?up|rewrite|migrate|migration)\b/,
    /\b(implement|build|write|create|generate|scaffold|set\s?up|integrate|wire up)\b.*\b(app|api|component|endpoint|service|script|feature|function|page|route|schema|model|test|tests)\b/,
    /\b(test|tests|testing|unit test|integration test|e2e|coverage)\b/,
    /\b(api|endpoint|route|routes|backend|frontend|full[\s-]?stack|server|client|database|db|schema|query|queries)\b/,
    /\b(component|hook|state|props|render|ui|ux)\b/,
    /\b(deploy|deployment|ci\/cd|pipeline|docker|container|kubernetes|k8s)\b/,
    /\b(git|github|gitlab|commit|branch|merge|pull request|pr|push|clone)\b/,
    /\b(review|code review|pr review|audit)\b.*\b(code|pr|pull request|repo|repository|function|file)\b/,
    /\b(analy[sz]e|inspect|explain|understand|document|documentation|comment)\b.*\b(code|codebase|repo|repository|file|function|class|module)\b/,

    // Languages / runtimes
    /\b(javascript|typescript|python|java|c\+\+|c#|golang|rust|ruby|php|kotlin|swift|scala|sql|bash|shell|powershell)\b/,
    /\b(node|node\.js|deno|bun)\b/,

    // Frameworks / libraries / tooling
    /\b(react|next\.?js|vue|nuxt|svelte|angular|express|nestjs|django|flask|fastapi|spring|rails|laravel)\b/,
    /\b(tailwind|css|sass|scss|webpack|vite|babel|eslint|prettier|npm|yarn|pnpm|pip|cargo|maven|gradle)\b/,
    /\b(zod|prisma|drizzle|mongoose|sequelize|graphql|rest api|grpc|websocket|sockjs|stomp)\b/,

    // File types / extensions
    /\.(ts|tsx|js|jsx|py|java|go|rs|rb|php|cs|cpp|c|json|yaml|yml|sql|env|md)\b/,

    // Cloud / infra / project-scoped verbs
    /\b(vercel|render|aws|azure|gcp|firebase|supabase|cli tool|npm package|cli command)\b/,
    /\b(this project|this repo|this codebase|my project|my repo|my codebase|the workspace)\b/,
  ];

  return patterns.some((re) => re.test(g));
}


const PLAN_INSTRUCTIONS = (codebase: string, hasWeb: boolean, includeCodeTools: boolean) =>
  [
    "You are Orbis, a Plan-Mode researcher. You DO NOT modify files.",
    includeCodeTools
      ? [
          `Workspace: ${codebase}`,
          "This goal relates to code, the workspace, or this project — use the read-only codebase tools (read_file/list_files/search_files/analyze_codebase/list_skills/read_skill) to research it.",
        ].join("\n")
      : "This goal is unrelated to code or the workspace — don't force codebase steps; research directly around the goal using whatever tools actually apply.",
    hasWeb
      ? "Web tools are available (web_search/web_crawl/fetch_url). Use them for anything requiring current or external information. Call at least one before answering."
      : "Web tools are unavailable (no FIRECRAWL_API_KEY) — for goals needing external/current information, say so plainly rather than guessing.",
    "Once you've gathered enough information, write up your findings in clear plain text. Do NOT worry about JSON or any particular output format at this stage — just summarize what you learned.",
  ].join("\n");

const STRUCTURE_INSTRUCTIONS =
  "You convert research notes into a structured execution plan. " +
  "Break the research into 1-15 concrete, actionable steps. " +
  "Output ONLY the JSON object matching the provided schema — no prose, no markdown, no commentary outside the schema fields.";

export async function generatePlan(goal: string) {
  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const executor = new ToolExecutor(tracker, config);

  const userConfig = readConfig();
  const firecrawlKey = userConfig?.firecrawlKey || process.env.FIRECRAWL_API_KEY;
  const hasWeb = !!firecrawlKey;
  const includeCodeTools = looksCodeRelated(goal);
  const tools = {
    ...(includeCodeTools ? readOnlyTools(executor) : {}),
    ...(hasWeb ? createWebTools(tracker, firecrawlKey) : {}),
  };

  const s = spinner();
  s.start("Researching");

  let research;
  try {
    // ── Phase 1: research freely with tools, no schema constraint ───────────
    research = await generateWithFallback((modelId) => {
      return generateText({
        model: getAgentModel(modelId),
        tools,
        // Direct-provider fallbacks (Groq/Cerebras) don't reliably support
        // forced tool_choice — relax to "auto" for them, keep "required" on
        // OpenRouter models where it worked cleanly.
        toolChoice: hasWeb && !isDirectProviderModel(modelId) ? "required" : "auto",
        stopWhen: stepCountIs(20),
        system: PLAN_INSTRUCTIONS(config.codebasePath, hasWeb, includeCodeTools),
        prompt: `User goal: \n${goal}`,
        maxOutputTokens: 8000,
        maxRetries: 0,
      });
    });
  } catch (err) {
    if (err instanceof AllModelsExhaustedError) {
      s.stop(chalk.red("✘ All models are currently unavailable."));
      const retrySuffix = err.retryAfterSeconds
        ? ` Try again in about ${err.retryAfterSeconds}s.`
        : " Try again in a minute or two.";
      throw new Error(
        `Couldn't reach any AI provider right now — every fallback model is rate-limited or down.${retrySuffix}`
      );
    }
    throw err;
  }

  s.message("Structuring plan");

  let structured;
  try {
    // ── Phase 2: reformat findings into schema, no tools ─────────────────────
    // Filter out models that reject response_format: json_schema (e.g. Groq's
    // llama-3.3-70b-versatile) so the chain never wastes a call on a
    // guaranteed 400.
    structured = await generateWithFallback(
      (modelId) => {
        return generateText({
          model: getAgentModel(modelId),
          system: STRUCTURE_INSTRUCTIONS,
          prompt: `Goal: ${goal}\n\nResearch notes:\n${research.text}`,
          output: Output.object({ schema: planSchema }),
          maxOutputTokens: 4000,
          maxRetries: 0,
        });
      },
      getFallbackModelIds().filter(supportsJsonSchema)
    );
  } catch (err) {
    if (err instanceof AllModelsExhaustedError) {
      s.stop(chalk.red("✘ All models are currently unavailable."));
      const retrySuffix = err.retryAfterSeconds
        ? ` Try again in about ${err.retryAfterSeconds}s.`
        : " Try again in a minute or two.";
      throw new Error(
        `Research succeeded, but couldn't structure the plan — every fallback model is rate-limited or down.${retrySuffix}`
      );
    }
    throw err;
  }

  s.stop(chalk.green("✓ Plan ready."));

  const validated = planSchema.parse(structured.output);

  if (validated.steps.length < 1 || validated.steps.length > 15) {
    throw new Error(
      `Plan must have 1-15 steps, got ${validated.steps.length}`
    );
  }

  const steps: PlanStep[] = validated.steps.map((s, i) => ({
    id: `step-${i + 1}`,
    title: s.title,
    description: s.description,
    hints: s.hints,
    complexity: s.complexity,
  }));

  return { goal, researchSummary: validated.researchSummary, steps };
}
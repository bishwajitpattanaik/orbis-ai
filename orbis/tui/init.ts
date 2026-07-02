import * as p from "@clack/prompts";
import { setTimeout as sleep } from "timers/promises";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";

// ── config path ──────────────────────────────────────────────────────────────
const CONFIG_DIR = path.join(os.homedir(), ".orbis");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export type OrbisConfig = {
  openrouterKey?: string;
  geminiKey?: string;
  defaultModel?: string;
  openrouterModelId?: string;
  firecrawlKey?: string;
  groqKey?: string;
  cerebrasKey?: string;
  setupComplete: boolean;
  createdAt: string;
};

export function readConfig(): OrbisConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function writeConfig(config: OrbisConfig) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

function openBrowser(url: string) {
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? `open "${url}"`
      : platform === "win32"
      ? `start "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd);
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

// ── main init ─────────────────────────────────────────────────────────────────
export async function runInit(force = false) {
  const existing = readConfig();

  // already set up — skip unless forced
  if (existing?.setupComplete && !force) {
    p.intro(`  orbis  `);
    p.note(
      [
        `Config already exists at ${CONFIG_FILE}`,
        ``,
        existing.openrouterKey
          ? `OpenRouter  ${maskKey(existing.openrouterKey)}`
          : `OpenRouter  not set`,
        existing.geminiKey
          ? `Gemini      ${maskKey(existing.geminiKey)}`
          : `Gemini      not set`,
        `Default     ${existing.defaultModel ?? "openrouter"}`,
        existing.openrouterModelId
          ? `Model       ${existing.openrouterModelId}`
          : `Model       not set`,
        existing.firecrawlKey
          ? `Firecrawl   ${maskKey(existing.firecrawlKey)}`
          : `Firecrawl   not set (web research disabled)`,
        existing.groqKey
          ? `Groq        ${maskKey(existing.groqKey)}`
          : `Groq        not set`,
        existing.cerebrasKey
          ? `Cerebras    ${maskKey(existing.cerebrasKey)}`
          : `Cerebras    not set`,
      ].join("\n"),
      "Current setup"
    );

    const reconfigure = await p.confirm({
      message: "Reconfigure?",
      initialValue: false,
    });

    if (p.isCancel(reconfigure) || !reconfigure) {
      p.outro("Nothing changed.");
      process.exit(0);
    }
  }

  // ── intro ──────────────────────────────────────────────────────────────────
  p.intro(`  orbis init  `);

  p.note(
    [
      "Orbis runs entirely on your machine.",
      "Your API keys stay local in ~/.orbis/config.json",
      "and are never sent anywhere except the LLM provider.",
    ].join("\n"),
    "Local-first"
  );

  // ── choose provider ────────────────────────────────────────────────────────
  const provider = await p.select({
    message: "Which provider do you want to use?",
    options: [
      {
        value: "openrouter",
        label: "OpenRouter",
        hint: "access DeepSeek, Qwen, Mistral & more — free models available",
      },
      {
        value: "gemini",
        label: "Gemini",
        hint: "Google's models — generous free tier",
      },
      {
        value: "both",
        label: "Both",
        hint: "set up OpenRouter + Gemini, pick default",
      },
    ],
  });

  if (p.isCancel(provider)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const config: OrbisConfig = {
    setupComplete: false,
    createdAt: new Date().toISOString(),
  };

  // ── openrouter setup ───────────────────────────────────────────────────────
  if (provider === "openrouter" || provider === "both") {
    const hasKey = await p.confirm({
      message: "Do you already have an OpenRouter API key?",
      initialValue: true,
    });

    if (p.isCancel(hasKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    if (!hasKey) {
      p.note(
        [
          "1. Go to openrouter.ai and create a free account",
          "2. Navigate to Keys → Create Key",
          "3. Copy the key and come back here",
          "",
          "OpenRouter gives free credits on signup.",
          "No card required to get started.",
        ].join("\n"),
        "Get your key"
      );

      const open = await p.confirm({
        message: "Open openrouter.ai/keys in your browser?",
        initialValue: true,
      });

      if (!p.isCancel(open) && open) {
        openBrowser("https://openrouter.ai/keys");
        const s = p.spinner();
        s.start("Opening browser");
        await sleep(1500);
        s.stop("Browser opened");
      }
    }

    const orKey = await p.password({
      message: "Paste your OpenRouter API key:",
      validate(val) {
        if (!val || val.trim().length < 10)
          return "Key looks too short — check and try again.";
        if (!val.startsWith("sk-or-"))
          return 'OpenRouter keys start with "sk-or-" — is this the right key?';
      },
    });

    if (p.isCancel(orKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    config.openrouterKey = orKey.trim();

    // ── model selection ───────────────────────────────────────────────────
    p.note(
      "Free models can hit temporary rate limits during peak hours — Orbis will automatically fall back to another free model if that happens.",
      "Heads up"
    );

    const modelChoice = await p.select({
      message: "Which OpenRouter model should Orbis use?",
      options: [
        {
          value: "openai/gpt-oss-120b:free",
          label: "GPT-OSS 120B (free)",
          hint: "99.9% uptime, strong tool-calling — recommended",
        },
        {
          value: "google/gemma-4-26b-a4b-it:free",
          label: "Gemma 4 26B A4B (free)",
          hint: "98.9% uptime, 262K context, native function calling",
        },
        {
          value: "cohere/north-mini-code:free",
          label: "Cohere North Mini Code (free)",
          hint: "agentic coding model, 97.1% uptime",
        },
        {
          value: "deepseek/deepseek-v4-flash",
          label: "DeepSeek V4 Flash (paid, cheap)",
          hint: "$0.09/$0.18 per M tokens — fast & reliable",
        },
        {
          value: "custom",
          label: "Custom model ID",
          hint: "enter any OpenRouter slug manually",
        },
      ],
    });

    if (p.isCancel(modelChoice)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    if (modelChoice === "custom") {
      const customId = await p.text({
        message: "Enter the OpenRouter model slug:",
        placeholder: "e.g. deepseek/deepseek-v4-flash",
        validate(val) {
          if (!val || !val.includes("/")) return "Should look like provider/model-name";
        },
      });
      if (p.isCancel(customId)) {
        p.cancel("Setup cancelled.");
        process.exit(0);
      }
      config.openrouterModelId = customId.trim();
    } else {
      config.openrouterModelId = modelChoice as string;
    }
  }

  // ── gemini setup ───────────────────────────────────────────────────────────
  if (provider === "gemini" || provider === "both") {
    const hasKey = await p.confirm({
      message: "Do you already have a Gemini API key?",
      initialValue: true,
    });

    if (p.isCancel(hasKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    if (!hasKey) {
      p.note(
        [
          "1. Go to aistudio.google.com",
          "2. Click Get API Key → Create API Key",
          "3. Copy the key and come back here",
          "",
          "Gemini has a generous free tier (no card needed).",
        ].join("\n"),
        "Get your key"
      );

      const open = await p.confirm({
        message: "Open aistudio.google.com in your browser?",
        initialValue: true,
      });

      if (!p.isCancel(open) && open) {
        openBrowser("https://aistudio.google.com/app/apikey");
        const s = p.spinner();
        s.start("Opening browser");
        await sleep(1500);
        s.stop("Browser opened");
      }
    }

    const gemKey = await p.password({
      message: "Paste your Gemini API key:",
      validate(val) {
        if (!val || val.trim().length < 10)
          return "Key looks too short — check and try again.";
      },
    });

    if (p.isCancel(gemKey)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    config.geminiKey = gemKey.trim();
  }

  // ── firecrawl setup (optional) ──────────────────────────────────────────────
  const wantsWeb = await p.confirm({
    message: "Enable web research? (lets Orbis search & crawl the web during Ask/Plan/Agent mode)",
    initialValue: true,
  });

  if (!p.isCancel(wantsWeb) && wantsWeb) {
    const hasFcKey = await p.confirm({
      message: "Do you already have a Firecrawl API key?",
      initialValue: false,
    });

    if (!p.isCancel(hasFcKey) && !hasFcKey) {
      p.note(
        [
          "1. Go to firecrawl.dev and create a free account",
          "2. Copy your API key from the dashboard",
          "3. Copy the key and come back here",
          "",
          "Firecrawl's free tier is enough for casual use.",
        ].join("\n"),
        "Get your key"
      );

      const open = await p.confirm({
        message: "Open firecrawl.dev in your browser?",
        initialValue: true,
      });

      if (!p.isCancel(open) && open) {
        openBrowser("https://firecrawl.dev");
        const s = p.spinner();
        s.start("Opening browser");
        await sleep(1500);
        s.stop("Browser opened");
      }
    }

    const fcKey = await p.password({
      message: "Paste your Firecrawl API key (or press Enter to skip):",
      validate(val) {
        if (val && val.trim().length > 0 && val.trim().length < 10)
          return "Key looks too short — check and try again.";
      },
    });

    if (!p.isCancel(fcKey) && fcKey.trim()) {
      config.firecrawlKey = fcKey.trim();
    }
  }

  // ── groq + cerebras setup (optional direct-provider fallback) ──────────────
  p.note(
    [
      "Groq and Cerebras each give their own independent free daily quota",
      "separate from OpenRouter's shared free-tier cap. Adding either here",
      "lets Orbis fall back to them if OpenRouter's free models are rate limited.",
    ].join("\n"),
    "Extra fallback (optional)"
  );

  const wantsDirectFallback = await p.confirm({
    message: "Add Groq and/or Cerebras as extra fallback providers?",
    initialValue: false,
  });

  if (!p.isCancel(wantsDirectFallback) && wantsDirectFallback) {
    // ── groq ──
    const hasGroqKey = await p.confirm({
      message: "Do you already have a Groq API key?",
      initialValue: false,
    });

    if (!p.isCancel(hasGroqKey) && !hasGroqKey) {
      p.note(
        [
          "1. Go to console.groq.com and create a free account",
          "2. Navigate to API Keys → Create Key",
          "3. Copy the key and come back here",
          "",
          "No card required.",
        ].join("\n"),
        "Get your Groq key"
      );

      const openGroq = await p.confirm({
        message: "Open console.groq.com in your browser?",
        initialValue: true,
      });

      if (!p.isCancel(openGroq) && openGroq) {
        openBrowser("https://console.groq.com/keys");
        const s = p.spinner();
        s.start("Opening browser");
        await sleep(1500);
        s.stop("Browser opened");
      }
    }

    const groqKey = await p.password({
      message: "Paste your Groq API key (or press Enter to skip):",
      validate(val) {
        if (val && val.trim().length > 0 && val.trim().length < 10)
          return "Key looks too short — check and try again.";
      },
    });

    if (!p.isCancel(groqKey) && groqKey.trim()) {
      config.groqKey = groqKey.trim();
    }

    // ── cerebras ──
    const hasCerebrasKey = await p.confirm({
      message: "Do you already have a Cerebras API key?",
      initialValue: false,
    });

    if (!p.isCancel(hasCerebrasKey) && !hasCerebrasKey) {
      p.note(
        [
          "1. Go to cloud.cerebras.ai and create a free account",
          "2. Navigate to API Keys → Create Key",
          "3. Copy the key and come back here",
          "",
          "No card required.",
        ].join("\n"),
        "Get your Cerebras key"
      );

      const openCerebras = await p.confirm({
        message: "Open cloud.cerebras.ai in your browser?",
        initialValue: true,
      });

      if (!p.isCancel(openCerebras) && openCerebras) {
        openBrowser("https://cloud.cerebras.ai");
        const s = p.spinner();
        s.start("Opening browser");
        await sleep(1500);
        s.stop("Browser opened");
      }
    }

    const cerebrasKey = await p.password({
      message: "Paste your Cerebras API key (or press Enter to skip):",
      validate(val) {
        if (val && val.trim().length > 0 && val.trim().length < 10)
          return "Key looks too short — check and try again.";
      },
    });

    if (!p.isCancel(cerebrasKey) && cerebrasKey.trim()) {
      config.cerebrasKey = cerebrasKey.trim();
    }
  }

  // ── pick default if both ───────────────────────────────────────────────────
  if (provider === "both") {
    const defaultModel = await p.select({
      message: "Which provider should Orbis use by default?",
      options: [
        {
          value: "openrouter",
          label: "OpenRouter",
          hint: "DeepSeek, Qwen, Mistral",
        },
        { value: "gemini", label: "Gemini", hint: "Google's models" },
      ],
    });

    if (p.isCancel(defaultModel)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    config.defaultModel = defaultModel;
  } else {
    config.defaultModel = provider as string;
  }

  // ── save ───────────────────────────────────────────────────────────────────
  const s = p.spinner();
  s.start("Saving config");
  await sleep(800);

  config.setupComplete = true;
  writeConfig(config);

  s.stop("Config saved to ~/.orbis/config.json");

  // ── summary ────────────────────────────────────────────────────────────────
  p.note(
    [
      config.openrouterKey
        ? `OpenRouter  ${maskKey(config.openrouterKey)}`
        : null,
      config.openrouterModelId ? `Model       ${config.openrouterModelId}` : null,
      config.geminiKey ? `Gemini      ${maskKey(config.geminiKey)}` : null,
      config.firecrawlKey
        ? `Firecrawl   ${maskKey(config.firecrawlKey)}`
        : `Firecrawl   not set (web research disabled)`,
      config.groqKey ? `Groq        ${maskKey(config.groqKey)}` : null,
      config.cerebrasKey ? `Cerebras    ${maskKey(config.cerebrasKey)}` : null,
      `Default     ${config.defaultModel}`,
      ``,
      `Keys are stored locally. Orbis never sends them anywhere`,
      `except directly to the provider you chose.`,
    ]
      .filter(Boolean)
      .join("\n"),
    "Ready"
  );

  p.outro(`Run orbis wakeup to get started.`);
}
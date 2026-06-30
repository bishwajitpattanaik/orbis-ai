"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Terminal,
  MessageCircleQuestion,
  Compass,
  Bot,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Github,
} from "lucide-react";

const INSTALL_CMD = "npm i -g @orbis-ai/orbis@latest";

function CopyInstall({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(INSTALL_CMD);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={`group flex items-center justify-between gap-3 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/70 px-4 py-3 font-mono text-sm text-zinc-200 transition-colors hover:border-amber-500/50 ${className}`}
    >
      <span className="text-amber-500">$</span>
      <span className="flex-1 text-left">{INSTALL_CMD}</span>
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300" />
      )}
    </button>
  );
}

/**
 * Drop-in slot for a real terminal recording.
 * Recommended: record with asciinema (`asciinema rec demo.cast`),
 * then render it with `asciinema-player` (npm i asciinema-player)
 * inside this component, keyed by `castFile`.
 * Until then, this renders a static placeholder frame.
 */
function TerminalCast({
  castFile,
  command,
}: {
  castFile: string;
  command: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-1.5 border-b-2 border-dashed border-zinc-800 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-3 font-mono text-[11px] text-zinc-600">{castFile}</span>
      </div>
      <div className="flex min-h-[220px] flex-col justify-center gap-2 p-5 font-mono text-sm text-zinc-500">
        <div>
          <span className="text-amber-500">⬡</span> {command}
        </div>
        <div className="flex items-center gap-1.5 pt-2">
          <span className="h-3.5 w-1.5 animate-pulse bg-zinc-700" />
          <span className="text-xs text-zinc-700">recording goes here — {castFile}</span>
        </div>
      </div>
    </div>
  );
}

type ModeSection = {
  id: string;
  label: string;
  icon: typeof MessageCircleQuestion;
  accent: string;
  command: string;
  castFile: string;
  headline: string;
  body: string;
  bullets: string[];
};

const MODES: ModeSection[] = [
  {
    id: "ask",
    label: "Ask",
    icon: MessageCircleQuestion,
    accent: "text-cyan-400",
    command: "orbis ask",
    castFile: "ask.cast",
    headline: "Ask Orbis before you touch anything.",
    body: "Ask mode answers questions about your codebase with full read access and zero write access. No tool call in this mode can modify a file.",
    bullets: [
      "Reads files, searches the repo, never writes",
      "Good for understanding before you change anything",
      "Answers grounded in your actual code, not guesses",
    ],
  },
  {
    id: "plan",
    label: "Plan",
    icon: Compass,
    accent: "text-amber-400",
    command: "orbis plan",
    castFile: "plan.cast",
    headline: "Plan it with Orbis before changing code.",
    body: "Describe a goal. Orbis researches the repo, drafts a numbered plan, and waits — you choose which steps actually run.",
    bullets: [
      "Explores the codebase before proposing anything",
      "Breaks the goal into reviewable steps",
      "Nothing executes until you select and confirm",
    ],
  },
  {
    id: "agent",
    label: "Agent",
    icon: Bot,
    accent: "text-emerald-400",
    command: "orbis agent",
    castFile: "agent.cast",
    headline: "Let Orbis work, then review the diff.",
    body: "An autonomous tool-calling loop that reads, edits, and runs commands — but every file change is staged for your approval before it's written.",
    bullets: [
      "Multi-step tool use: read, edit, run, verify",
      "Every change staged, never applied silently",
      "Approve, deny, or edit before anything is saved",
    ],
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background font-sans text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-dashed border-zinc-800/80 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wide text-zinc-200">
            <span className="text-amber-500">⬡</span> ORBIS
          </div>
          <nav className="hidden items-center gap-6 font-mono text-xs text-zinc-500 sm:flex">
            {MODES.map((m) => (
              <a key={m.id} href={`#${m.id}`} className="transition-colors hover:text-zinc-200">
                {m.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/bishwajitpattanaik/orbis-ai"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Github className="h-5 w-5" />
            </a>
            <Link
              href="/sign-in"
              className="rounded-lg border-2 border-dashed border-zinc-700 px-4 py-2 font-mono text-xs text-zinc-300 transition-colors hover:border-amber-500/50 hover:text-amber-400"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-dashed border-zinc-700 px-3 py-1 font-mono text-[11px] text-zinc-500">
          <Terminal className="h-3 w-3" /> open source · published on npm
        </div>

        <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl">
          An AI agent that lives in your terminal —{" "}
          <span className="text-amber-500">but never moves without you.</span>
        </h1>

        <p className="mx-auto mb-9 max-w-xl text-base leading-relaxed text-zinc-400">
          Orbis answers questions, drafts execution plans, and writes code —
          but every file change sits staged for your review until you approve
          it.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CopyInstall className="w-full sm:w-auto" />
          <button
            onClick={() => router.push("/sign-in")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 sm:w-auto"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          GitHub-authenticated. Your API keys never leave your machine.
        </div>
      </section>

      {/* Mode sections */}
      {MODES.map((mode, i) => (
        <section
          key={mode.id}
          id={mode.id}
          className="mx-auto max-w-6xl scroll-mt-20 border-t border-dashed border-zinc-800 px-6 py-20"
        >
          <div
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <div className="mb-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-500">
                <mode.icon className={`h-4 w-4 ${mode.accent}`} />
                {mode.label} mode
              </div>
              <h2 className="mb-4 text-2xl font-bold leading-tight text-zinc-50 sm:text-3xl">
                {mode.headline}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-zinc-400">{mode.body}</p>
              <ul className="space-y-2.5">
                {mode.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${mode.accent} bg-current`} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <TerminalCast castFile={mode.castFile} command={mode.command} />
          </div>
        </section>
      ))}

      {/* Install footer */}
      <section className="mx-auto max-w-6xl border-t border-dashed border-zinc-800 px-6 py-20">
        <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center sm:p-12">
          <h2 className="mb-3 text-2xl font-bold text-zinc-50">
            Two commands to your first session.
          </h2>
          <p className="mx-auto mb-7 max-w-sm text-sm text-zinc-500">
            Install the CLI, sign in with GitHub, and start in Ask, Plan, or Agent mode.
          </p>
          <div className="mx-auto flex max-w-md flex-col items-stretch gap-2 font-mono text-sm">
            <div className="rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-zinc-300">
              <span className="text-amber-500">$</span> {INSTALL_CMD}
            </div>
            <div className="rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-zinc-300">
              <span className="text-amber-500">$</span> orbis login
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-dashed border-zinc-800 px-6 py-8 text-center font-mono text-xs text-zinc-600">
        Built by Bishwajit Pattanaik · MIT Licensed
      </footer>
    </div>
  );
}
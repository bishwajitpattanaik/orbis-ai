"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pixelify_Sans } from "next/font/google";
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
  Eye,
  ClipboardCheck,
  Menu,
  X,
} from "lucide-react";

const pixel = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* ---------------------------------------------------------------------- */
/* Install                                                                */
/* ---------------------------------------------------------------------- */

type PM = "npm" | "pnpm" | "yarn" | "bun";

const PM_ORDER: PM[] = ["npm", "pnpm", "yarn", "bun"];

const INSTALL_COMMANDS: Record<PM, string> = {
  npm: "npm install -g @orbis-ai/orbis",
  pnpm: "pnpm add -g @orbis-ai/orbis",
  yarn: "yarn global add @orbis-ai/orbis",
  bun: "bun add -g @orbis-ai/orbis",
};

function InstallPanel({ className = "" }: { className?: string }) {
  const [pm, setPm] = useState<PM>("npm");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(INSTALL_COMMANDS[pm]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-lg shadow-zinc-200/60 ${className}`}
    >
      <div className="flex items-center border-b border-zinc-200 bg-zinc-50/70">
        {PM_ORDER.map((p) => (
          <button
            key={p}
            onClick={() => setPm(p)}
            className={`${pixel.className} flex-1 border-b-2 px-3 py-2.5 text-xs uppercase tracking-wide transition-colors ${
              pm === p
                ? "border-teal-500 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={copy}
        className="group flex w-full items-center justify-between gap-3 px-4 py-3.5 font-mono text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-teal-600">$</span>
          <span className="truncate">{INSTALL_COMMANDS[pm]}</span>
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm">
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-zinc-600" />
          )}
        </span>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Orbit motif — the signature element, re-toned for a light page         */
/* ---------------------------------------------------------------------- */

const ORBITS = [
  { radius: 130, duration: "22s", reverse: false, color: "#0d9488", label: "ask" },
  { radius: 180, duration: "31s", reverse: true, color: "#f59e0b", label: "plan" },
  { radius: 230, duration: "40s", reverse: false, color: "#6366f1", label: "agent" },
];

function OrbitField() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[190px] h-[480px] w-[480px] -translate-x-1/2 select-none sm:top-[170px]"
    >
      <div className="absolute inset-0 rounded-full bg-teal-500/[0.06] blur-3xl" />
      <svg viewBox="0 0 480 480" className="absolute inset-0 h-full w-full">
        {ORBITS.map((o) => (
          <circle
            key={o.label}
            cx="240"
            cy="240"
            r={o.radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="1.5"
          />
        ))}
        <circle cx="240" cy="240" r="2.5" fill="#a1a1aa" />
      </svg>
      {ORBITS.map((o) => (
        <div
          key={o.label}
          className="orbit-spin absolute left-1/2 top-1/2"
          style={{
            width: o.radius * 2,
            height: o.radius * 2,
            marginLeft: -o.radius,
            marginTop: -o.radius,
            animation: `spin ${o.duration} linear infinite ${o.reverse ? "reverse" : ""}`,
          }}
        >
          <span
            className="absolute left-1/2 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white"
            style={{ width: 9, height: 9, background: o.color }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .orbit-spin {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function OrbitBadge() {
  return (
    <div aria-hidden className="relative mx-auto mb-6 h-14 w-14">
      <div className="orbit-pulse absolute inset-0 rounded-full border-2 border-teal-500/30" />
      <div className="absolute inset-[9px] rounded-full border border-zinc-200 bg-white shadow-sm" />
      <div className="absolute inset-0 flex items-center justify-center text-base text-teal-600">⬡</div>
      <style jsx>{`
        @keyframes pulse-ring {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.2;
          }
        }
        .orbit-pulse {
          animation: pulse-ring 3.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .orbit-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Terminal cast placeholder                                              */
/* ---------------------------------------------------------------------- */

function TerminalCast({
  castFile,
  title,
  command,
  accent,
}: {
  castFile: string;
  title: string;
  command: string;
  accent: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/60">
      <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50/70 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F56" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27C93F" }} />
        <span className={`${pixel.className} ml-3 text-[11px] uppercase tracking-wide text-zinc-500`}>
          {title}
        </span>
      </div>
      <div className="flex min-h-[220px] flex-col justify-center gap-2 bg-zinc-50/40 p-5 font-mono text-sm text-zinc-500">
        <div>
          <span style={{ color: accent }}>$</span> {command}
        </div>
        <div className="flex items-center gap-1.5 pt-2">
          <span className="h-3.5 w-1.5 animate-pulse bg-zinc-300" />
          <span className="text-xs text-zinc-400">recording goes here — {castFile}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Modes                                                                  */
/* ---------------------------------------------------------------------- */

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
    accent: "#0d9488",
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
    accent: "#f59e0b",
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
    accent: "#6366f1",
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

/* ---------------------------------------------------------------------- */
/* How it works                                                           */
/* ---------------------------------------------------------------------- */

const STEPS = [
  {
    n: "01",
    icon: Terminal,
    title: "Pick a mode",
    body: "orbis ask, orbis plan, or orbis agent — how much control you hand over is your call, every session.",
  },
  {
    n: "02",
    icon: Eye,
    title: "Orbis reads first",
    body: "It explores the repo, gathers real context, and works out what a change would actually involve before proposing one.",
  },
  {
    n: "03",
    icon: ClipboardCheck,
    title: "You approve every write",
    body: "Edits are staged as a diff, not applied. Nothing touches disk until you say yes.",
  },
];

const NAV_ITEMS = [
  { id: "ask", label: "Ask" },
  { id: "plan", label: "Plan" },
  { id: "agent", label: "Agent" },
  { id: "how", label: "How it works" },
  { id: "install", label: "Install" },
];

/* ---------------------------------------------------------------------- */
/* Page                                                                    */
/* ---------------------------------------------------------------------- */

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className={`${pixel.className} min-h-screen bg-white text-zinc-900`}>
      {/* Top bar — fixed, transparent, glass pill nav */}
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="relative flex items-center justify-between px-6 py-4 sm:px-8">
          <a href="#" className="text-sm font-bold tracking-wide text-zinc-900">
            <span className="text-teal-600">⬡</span> ORBIS
          </a>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/60 bg-white/50 p-1.5 shadow-lg shadow-zinc-200/50 backdrop-blur-xl backdrop-saturate-150 sm:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                  <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-teal-500" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
              <a
              href="https://github.com/bishwajitpattanaik/orbis-ai"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 transition-colors hover:text-zinc-900"
            >
              <Github className="h-4 w-4" />
            </a>
            <Link
              href="/sign-in"
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs text-white transition-colors hover:bg-zinc-700"
            >
              Get Orbis
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="text-zinc-900 sm:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile full-screen drawer */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-white/95 backdrop-blur-xl transition-transform duration-300 ease-in-out sm:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-6 top-5 text-zinc-900"
        >
          <X className="h-6 w-6" />
        </button>

        {NAV_ITEMS.map((item) => (
            <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setMobileOpen(false)}
            className="py-3 text-2xl font-semibold text-zinc-800 transition-colors hover:text-teal-600"
          >
            {item.label}
          </a>
        ))}

        <div className="mt-6 flex items-center gap-4">
            <a
            href="https://github.com/bishwajitpattanaik/orbis-ai"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500"
          >
            <Github className="h-5 w-5" />
          </a>
          <Link
            href="/sign-in"
            onClick={() => setMobileOpen(false)}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white"
          >
            Get Orbis
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-3xl overflow-hidden px-6 pb-16 pt-24 text-center">
        <OrbitField />

        <div className="relative z-10">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-500 shadow-sm">
            <Terminal className="h-3 w-3" /> open source · published on npm
          </div>

          <h1 className="mb-5 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-900 sm:text-5xl">
            Three modes orbit your codebase.{" "}
            <span className="text-teal-600">Only you decide what lands.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-zinc-500">
            Orbis answers questions, drafts execution plans, and writes code —
            but every file change sits staged for your review until you approve
            it.
          </p>

          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3">
            <InstallPanel />
            <button
              onClick={() => router.push("/sign-in")}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            GitHub-authenticated. Your API keys never leave your machine.
          </div>
        </div>

        {/* scroll strip, echoes Perry's bottom-of-hero status bar */}
        <div className="relative z-10 mx-auto mt-16 flex max-w-md items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/70 px-4 py-2 text-[11px] text-zinc-400 shadow-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: "#FF5F56" }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#FFBD2E" }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#27C93F" }} />
          <span className="ml-1">scroll to see how it works</span>
        </div>
      </section>

      {/* Mode sections */}
      {MODES.map((mode, i) => (
        <section
          key={mode.id}
          id={mode.id}
          className="mx-auto max-w-6xl scroll-mt-28 border-t border-zinc-100 px-6 py-20"
        >
          <div
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
                <mode.icon className="h-4 w-4" style={{ color: mode.accent }} />
                {mode.label} mode
              </div>
              <h2 className="mb-4 text-2xl font-semibold leading-tight text-zinc-900 sm:text-3xl">
                {mode.headline}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-zinc-500">{mode.body}</p>
              <ul className="space-y-2.5">
                {mode.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-500">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: mode.accent }}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <TerminalCast
              castFile={mode.castFile}
              title={`orbis: ${mode.label.toLowerCase()} mode`}
              command={mode.command}
              accent={mode.accent}
            />
          </div>
        </section>
      ))}

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-28 border-t border-zinc-100 px-6 py-20">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
            <span className="text-teal-600">⬡</span> how it works
          </div>
          <h2 className="mx-auto max-w-xl text-2xl font-semibold leading-tight text-zinc-900 sm:text-3xl">
            Every mode follows the same orbit.
          </h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden border-t border-dashed border-zinc-200 md:block" />
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">{s.n}</span>
                <s.icon className="h-4 w-4 text-teal-600" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-zinc-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install footer */}
      <section id="install" className="mx-auto max-w-6xl scroll-mt-28 border-t border-zinc-100 px-6 py-20">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/60 p-8 text-center sm:p-12">
          <OrbitBadge />
          <h2 className="mb-3 text-2xl font-semibold text-zinc-900">
            Two commands to your first session.
          </h2>
          <p className="mx-auto mb-7 max-w-sm text-sm text-zinc-500">
            Install the CLI, sign in with GitHub, and start in Ask, Plan, or Agent mode.
          </p>
          <div className="mx-auto flex max-w-md flex-col items-stretch gap-3">
            <InstallPanel />
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-left font-mono text-sm text-zinc-700 shadow-sm">
              <span className="text-teal-600">$</span> orbis login
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-500">
            <a href="#ask" className="transition-colors hover:text-zinc-900">Modes</a>
            <a href="#how" className="transition-colors hover:text-zinc-900">How it works</a>
            <a href="#install" className="transition-colors hover:text-zinc-900">Install</a>
              <a
              href="https://github.com/bishwajitpattanaik/orbis-ai"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-zinc-900"
            >
              GitHub
            </a>
          </nav>
          <p className="text-xs text-zinc-400">Built by Bishwajit Pattanaik · MIT Licensed</p>
        </div>
      </footer>
    </div>
  );
}

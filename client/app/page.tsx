"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pixelify_Sans } from "next/font/google";
import AsciinemaPlayerComponent from "@/components/ui/asciinemaPlayer";
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
  Sun,
  Moon,
  Linkedin,
} from "lucide-react";

const pixel = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* ---------------------------------------------------------------------- */
/* Theme toggle                                                           */
/* ---------------------------------------------------------------------- */

type Theme = "light" | "dark";
const THEME_KEY = "orbis-theme";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const preferred: Theme =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", preferred === "dark");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resolving the real client-only preference (localStorage/matchMedia) after mount; server has no access to either, so this can't run earlier
    setTheme(preferred);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- canonical client-mount detection, not a derived-state anti-pattern
    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  return { theme, toggle, mounted };
}

function ThemeToggle({
  theme,
  toggle,
  className = "",
}: {
  theme: Theme;
  toggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`relative flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition-colors hover:text-teal-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-teal-400 dark:hover:text-teal-300 ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

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
      className={`w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-lg shadow-zinc-200/60 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40 ${className}`}
    >
      <div className="flex items-center border-b border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/70">
        {PM_ORDER.map((p) => (
          <button
            key={p}
            onClick={() => setPm(p)}
            className={`${pixel.className} flex-1 border-b-2 px-3 py-2.5 text-xs uppercase tracking-wide transition-colors ${
              pm === p
                ? "border-teal-500 text-zinc-900 dark:text-zinc-50"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={copy}
        className="group flex w-full items-center justify-between gap-3 px-4 py-3.5 font-mono text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-teal-600 dark:text-teal-400">$</span>
          <span className="truncate">{INSTALL_COMMANDS[pm]}</span>
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300" />
          )}
        </span>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Orbit motif                                                            */
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
      <div className="absolute inset-0 rounded-full bg-teal-500/[0.06] blur-3xl dark:bg-teal-400/[0.1]" />
      <svg viewBox="0 0 480 480" className="absolute inset-0 h-full w-full">
        {ORBITS.map((o) => (
          <circle
            key={o.label}
            cx="240"
            cy="240"
            r={o.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-zinc-200 dark:text-zinc-800"
          />
        ))}
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
            className="absolute left-1/2 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white dark:ring-zinc-950"
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
      <div className="orbit-pulse absolute inset-0 rounded-full border-2 border-teal-500/30 dark:border-teal-400/30" />
      <div className="absolute inset-[9px] rounded-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900" />
      <div className="absolute inset-0 flex items-center justify-center text-base text-teal-600 dark:text-teal-400">
        ⬡
      </div>
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
/* Hero terminal                                                          */
/* ---------------------------------------------------------------------- */

const HERO_COMMANDS = [
  { cmd: "orbis login", sub: "signing in" },
  { cmd: "orbis wakeup", sub: "booting orbis" },
  { cmd: "orbis agent", sub: "loading context" },
  { cmd: "orbis ask", sub: "searching web" },
  { cmd: "orbis plan", sub: "drafting steps" },
  { cmd: "orbis logout", sub: "exiting orbis" },
];

const TYPE_SPEED = 60;
const DELETE_SPEED = 30;
const HOLD_AFTER_TYPE = 1200;
const HOLD_AFTER_DELETE = 300;

function HeroTerminal() {
  const [cmdIndex, setCmdIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  useEffect(() => {
    const full = HERO_COMMANDS[cmdIndex].cmd;
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text.length < full.length) {
        timeout = setTimeout(() => setText(full.slice(0, text.length + 1)), TYPE_SPEED);
      } else {
        timeout = setTimeout(() => setPhase("deleting"), HOLD_AFTER_TYPE);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), DELETE_SPEED);
      } else {
        timeout = setTimeout(() => {
          setCmdIndex((i) => (i + 1) % HERO_COMMANDS.length);
          setPhase("typing");
        }, HOLD_AFTER_DELETE);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, phase, cmdIndex]);

  return (
    <div className="mx-auto mb-8 w-[150px] rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 font-mono text-[10px] shadow-lg shadow-zinc-900/20 dark:border-zinc-700 dark:shadow-teal-500/5">
      <div className="mb-1.5 flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#FF5F56" }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#FFBD2E" }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#27C93F" }} />
      </div>
      <div className="whitespace-nowrap text-teal-400">
        $ {text}
        <span className="terminal-cursor">▌</span>
      </div>
      <div className="mt-1 text-zinc-500">
        → {HERO_COMMANDS[cmdIndex].sub}
        <span className="terminal-dots">...</span>
      </div>
      <style jsx>{`
        @keyframes dots {
          0%,
          20% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
        .terminal-dots {
          animation: dots 1.6s ease-in-out infinite;
        }
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
        .terminal-cursor {
          animation: blink 0.8s step-end infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .terminal-dots,
          .terminal-cursor {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Terminal cast — lazy-mounts the asciinema player when scrolled into    */
/* view, and unmounts (disposing the player) when it scrolls out.         */
/*                                                                        */
/* Each recording is 156 cols wide, but real content in every recording   */
/* only ever uses roughly the left 84–86 columns — the rest is genuinely  */
/* blank terminal for the entire session, not a rendering bug. These      */
/* numbers come from actually replaying each .cast file through a real    */
/* terminal emulator (xterm-headless) and measuring the true bounding box */
/* of non-blank content across every frame — not eyeballed from a         */
/* screenshot, which is why all three end up needing nearly the same crop */
/* despite ask/plan/agent looking different in a still frame.             */
/*                                                                        */
/* Measured (full recordings):                                            */
/*  - ask.cast:   84 cols x 41 rows real content                          */
/*  - plan.cast:  86 cols x 41 rows real content                          */
/*  - agent.cast: 84 cols x 41 rows real content                          */
/*                                                                        */
/* cols is set to measured width + a small margin so nothing real gets    */
/* clipped. rows is deliberately cropped well below the recorded 41 —     */
/* since this is a live terminal, older lines just scroll off the top of  */
/* the visible window exactly like a real shorter terminal would; nothing */
/* is lost, it's just a moving window over the last N lines. rows/cols is */
/* kept at a consistent ratio (~0.27) across all three so the cards end   */
/* up the same visual height at a given width instead of some being       */
/* taller or shorter than the others.                                     */
const CAST_CONFIG: Record<string, { cols: number; rows: number }> = {
  "ask.cast": { cols: 100, rows: 27 },
  "plan.cast": { cols: 104, rows: 28 },
  "agent.cast": { cols: 100, rows: 27 },
};

function TerminalCast({
  castFile,
  title,
  accent,
}: {
  castFile: string;
  title: string;
  accent: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const { cols, rows } = CAST_CONFIG[castFile] ?? { cols: 100, rows: 27 };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/60 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
    >
      <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F56" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#27C93F" }} />
        <span
          className={`${pixel.className} ml-3 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400`}
        >
          {title}
        </span>
      </div>

      <div className="w-full overflow-hidden bg-zinc-950 p-2">
        {inView ? (
          <AsciinemaPlayerComponent
            src={`/casts/${castFile}`}
            cols={cols}
            rows={rows}
            fit="width"
            className="[&_.ap-player]:!bg-transparent"
          />
        ) : (
          <div className="flex aspect-video flex-col justify-center gap-2 p-3 font-mono text-sm text-zinc-500">
            <div>
              <span style={{ color: accent }}>$</span> orbis {title.split(": ")[1]?.split(" ")[0]}
            </div>
            <div className="flex items-center gap-1.5 pt-2">
              <span className="h-3.5 w-1.5 bg-zinc-700" />
              <span className="text-xs text-zinc-600">scroll to play</span>
            </div>
          </div>
        )}
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
    title: "Log into Orbis",
    body: "Sign in with GitHub to verify it's you, then enter the code it hands you back to bring your device into the session — no passwords, ever.",
  },
  {
    n: "02",
    icon: Eye,
    title: "Initialise your keys",
    body: "The first run fires orbis init automatically via orbis wakeup cmd, walking you through your API keys. They're stored on your machine and never leave it",
  },
  {
    n: "03",
    icon: ClipboardCheck,
    title: "Pick a mode and do great things",
    body: "Ask, plan, or agent — once you're authenticated and initialized, every mode is one command away.",
  },
];

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "ask", label: "Features" },
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
  const { theme, toggle: toggleTheme, mounted } = useTheme();

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
    <div
      className={`${pixel.className} min-h-screen bg-white text-zinc-900 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-50 ${
        mounted ? "" : "invisible"
      }`}
    >
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="relative flex items-center justify-between px-6 py-4 sm:px-8">
          <a href="#home" className="text-sm font-bold tracking-wide text-zinc-900 dark:text-zinc-50">
            <span className="text-teal-600 dark:text-teal-400">⬡</span> ORBIS
          </a>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/60 bg-white/50 p-1.5 shadow-lg shadow-zinc-200/50 backdrop-blur-xl backdrop-saturate-150 sm:flex dark:border-zinc-800/60 dark:bg-zinc-900/50 dark:shadow-black/40">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-teal-500 dark:bg-teal-400" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <ThemeToggle theme={theme} toggle={toggleTheme} />
            <Link
              href="/sign-in"
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs text-white transition-colors hover:bg-zinc-700 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
            >
              Get Orbis
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="text-zinc-900 dark:text-zinc-50 sm:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile full-screen drawer */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-white/95 backdrop-blur-xl transition-transform duration-300 ease-in-out dark:bg-zinc-950/95 sm:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-6 top-5 text-zinc-900 dark:text-zinc-50"
        >
          <X className="h-6 w-6" />
        </button>

        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setMobileOpen(false)}
            className="py-3 text-2xl font-semibold text-zinc-800 transition-colors hover:text-teal-600 dark:text-zinc-200 dark:hover:text-teal-400"
          >
            {item.label}
          </a>
        ))}

        <div className="mt-6 flex items-center gap-4">
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <a
            href="https://linkedin.com/in/YOUR_HANDLE"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 dark:text-zinc-400"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <Link
            href="/sign-in"
            onClick={() => setMobileOpen(false)}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white dark:bg-teal-500 dark:text-zinc-950"
          >
            Get Orbis
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section id="home" className="relative mx-auto max-w-3xl overflow-hidden px-6 pb-16 pt-24 text-center">
        <OrbitField />

        <div className="relative z-10">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Terminal className="h-3 w-3" /> open source · published on npm
          </div>

          <h1 className="mb-5 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Three modes orbit your codebase.{" "}
            <span className="text-teal-600 dark:text-teal-400">Only you decide what lands.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            Orbis answers questions, drafts execution plans, and writes code — but every
            file change sits staged for your review until you approve it.
          </p>

          <HeroTerminal />

          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3">
            <InstallPanel />
            <button
              onClick={() => router.push("/sign-in")}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            GitHub-authenticated. Your API keys never leave your machine.
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-16 flex max-w-md items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/70 px-4 py-2 text-[11px] text-zinc-400 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-500">
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
          className="mx-auto max-w-6xl scroll-mt-28 border-t border-zinc-100 px-6 py-20 dark:border-zinc-900"
        >
          <div
            className={`grid items-center gap-12 lg:grid-cols-2 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <div className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <mode.icon className="h-4 w-4" style={{ color: mode.accent }} />
                {mode.label} mode
              </div>
              <h2 className="mb-4 text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                {mode.headline}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {mode.body}
              </p>
              <ul className="space-y-2.5">
                {mode.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
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
              accent={mode.accent}
            />
          </div>
        </section>
      ))}

      {/* How it works */}
      <section
        id="how"
        className="mx-auto max-w-6xl scroll-mt-28 border-t border-zinc-100 px-6 py-20 dark:border-zinc-900"
      >
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <span className="text-teal-600 dark:text-teal-400">⬡</span> how it works
          </div>
          <h2 className="mx-auto max-w-xl text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            See how the world of Orbis functions.
          </h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden border-t border-dashed border-zinc-200 dark:border-zinc-800 md:block" />
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs text-zinc-400 dark:text-zinc-600">{s.n}</span>
                <s.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install footer */}
      <section
        id="install"
        className="mx-auto max-w-6xl scroll-mt-28 border-t border-zinc-100 px-6 py-20 dark:border-zinc-900"
      >
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/60 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-12">
          <OrbitBadge />
          <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            First steps toward your own Orbis session.
          </h2>
          <p className="mx-auto mb-7 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Install the Orbis, sign in with GitHub, authorize your device and start in Ask, Plan, or Agent mode.
          </p>
          <div className="mx-auto flex max-w-md flex-col items-stretch gap-3">
            <InstallPanel />
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-left font-mono text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <span className="text-teal-600 dark:text-teal-400">$</span> orbis login
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 px-6 py-10 dark:border-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-500 dark:text-zinc-400">
            <a href="#ask" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
              Modes
            </a>
            <a href="#how" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
              How it works
            </a>
            <a href="#install" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">
              Install
            </a>

            <span className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />

            <a
              href="https://www.linkedin.com/in/bishwajit-pattanaik-717818320/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-teal-600 transition-colors hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Reach out to me
            </a>
          </nav>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Built by Bishwajit Pattanaik · 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
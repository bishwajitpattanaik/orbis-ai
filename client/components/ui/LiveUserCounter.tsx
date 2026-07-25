"use client";

import { useEffect, useState } from "react";
import { Users, Download } from "lucide-react";

const COUNT_ENDPOINT = "https://orbis-ai-l2n7.onrender.com/api/telemetry/count";
const POLL_INTERVAL_MS = 60_000; // refresh once a minute — plenty for a "live" feel without hammering the API

interface Counts {
  installs: number;
  users: number;
}

export function LiveUserCounter({ className = "" }: { className?: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      try {
        const res = await fetch(COUNT_ENDPOINT);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setCounts(data);
      } catch {
        // Silently ignore — if the backend is briefly down or cold-starting,
        // just keep showing whatever we last had (or nothing, on first load).
      }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Render nothing until the first successful fetch — avoids a
  // flash-of-zero before real numbers arrive.
  if (!counts) return null;

  return (
    <div
      className={`inline-flex items-center gap-4 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 ${className}`}
    >
      <span className="flex items-center gap-1.5">
        <Download className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {counts.installs.toLocaleString()}
        </span>
        installs
      </span>
      <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-700" />
      <span className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {counts.users.toLocaleString()}
        </span>
        developers
      </span>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import "asciinema-player/dist/bundle/asciinema-player.css";

interface Props {
  src: string;
  className?: string;
  rows?: number;
  cols?: number;
  fit?: "width" | "height" | "both" | false;
}

export default function AsciinemaPlayerComponent({ src, className, rows, cols, fit = "width" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    let player: { dispose: () => void } | null = null;
    let cancelled = false;

    // Dynamic import: asciinema-player reads `window` at module-load time,
    // which crashes Next.js's server-side render pass even inside a client
    // component. Loading it here means it only ever runs in the browser.
    import("asciinema-player").then((AsciinemaPlayer) => {
      if (cancelled || !ref.current) return;
      player = AsciinemaPlayer.create(src, ref.current, {
        autoPlay: true,
        loop: true,
        controls: false,
        theme: "monokai",
        fit,
        speed: 1.3,
        ...(rows ? { rows } : {}),
        ...(cols ? { cols } : {}),
      });
    });

    return () => {
      cancelled = true;
      player?.dispose();
    };
  }, [src, rows, cols, fit]);

  return <div ref={ref} className={`h-full w-full ${className ?? ""}`} />;
}
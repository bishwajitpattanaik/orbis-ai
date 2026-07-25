// telemetry-route.js
// Receives anonymous first-run pings from the Orbis CLI, maintains a
// deduped install count in Upstash Redis, and pings a Discord webhook
// whenever a genuinely new install is recorded.

import { Router } from "express";
import { Redis } from "@upstash/redis";

const router = Router();

const redis = Redis.fromEnv(); // expects UPSTASH_REDIS_REST_URL / _TOKEN
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const INSTALL_IDS_KEY = "orbis:install_ids"; // Redis Set, for dedupe
const INSTALL_COUNT_KEY = "orbis:install_count"; // simple counter

// Allow your landing page's origin to call the public count endpoint
// from the browser. Only needed for GET /api/telemetry/count — the CLI's
// POST to /api/telemetry/install isn't a browser request, so it doesn't
// need CORS at all. Update this if your Vercel URL ever changes.
const ALLOWED_ORIGIN = "https://orbis-ai-bishwajitpattanaik.vercel.app";

async function notifyDiscord(content) {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.error("Discord notify failed:", err);
  }
}

router.post("/api/telemetry/install", async (req, res) => {
  res.status(204).end();

  try {
    const { installId, version, platform, nodeVersion } = req.body ?? {};
    if (!installId || typeof installId !== "string") return;

    const isNew = await redis.sadd(INSTALL_IDS_KEY, installId);
    if (!isNew) return;

    const total = await redis.incr(INSTALL_COUNT_KEY);

    await notifyDiscord(
      `🎉 **New Orbis install** (#${total})\n` +
        `Version: \`${version ?? "unknown"}\`\n` +
        `Platform: \`${platform ?? "unknown"}\` · Node \`${nodeVersion ?? "unknown"}\``
    );
  } catch (err) {
    console.error("Telemetry install handler error:", err);
  }
});

router.get("/api/telemetry/count", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);

  try {
    const [installs, users] = await Promise.all([
      redis.get(INSTALL_COUNT_KEY),
      redis.get("orbis:unique_user_count"),
    ]);
    res.json({ installs: installs ?? 0, users: users ?? 0 });
  } catch (err) {
    console.error("Telemetry count fetch error:", err);
    res.status(500).json({ error: "failed to fetch count" });
  }
});

export default router;
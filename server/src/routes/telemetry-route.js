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

async function notifyDiscord(content) {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    // Don't let a Discord API hiccup fail the telemetry request itself.
    console.error("Discord notify failed:", err);
  }
}

router.post("/api/telemetry/install", async (req, res) => {
  // Always respond fast — the CLI has a short timeout and doesn't care
  // about the response body, so never make the client wait on Redis/Discord.
  res.status(204).end();

  try {
    const { installId, version, platform, nodeVersion } = req.body ?? {};
    if (!installId || typeof installId !== "string") return;

    // SADD returns 1 if the ID was newly added, 0 if it already existed —
    // this is what makes the counter dedupe reinstalls/reruns correctly.
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

// Optional: an endpoint you can check yourself for the current counts,
// e.g. to show on the landing page ("Trusted by N developers").
// installs = unique machines that have ever run the CLI (anonymous)
// users    = unique people who have ever completed GitHub sign-in
router.get("/api/telemetry/count", async (_req, res) => {
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

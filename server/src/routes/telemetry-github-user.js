// telemetry-github-user.js
//
// Called from a better-auth databaseHooks.user.create.after hook — see
// auth.js for where this gets wired in. That hook fires exactly once per
// person, right when their user row is first inserted into Postgres, so
// this only needs to run on genuinely new sign-ins, not every login.
//
// The Redis SADD dedupe check below is kept as a safety net in case the
// hook ever fires more than once for the same user (e.g. retried writes),
// not as the primary dedupe mechanism.

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const GITHUB_USER_IDS_KEY = "orbis:github_user_ids"; // Redis Set, dedupe key
const UNIQUE_USER_COUNT_KEY = "orbis:unique_user_count";

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

/**
 * @param {{ id: string, login: string }} user
 *   id    - a stable unique identifier for the user (better-auth's own
 *           user.id is fine here, since the create-hook already guarantees
 *           this is a brand-new person)
 *   login - display name / email / GitHub username, whatever you have on
 *           hand, just used to make the Discord message readable
 */
export async function recordUniqueGithubUser(user) {
  try {
    const isNewUser = await redis.sadd(GITHUB_USER_IDS_KEY, String(user.id));
    if (!isNewUser) return; // already counted before — safety net, shouldn't normally trigger

    const total = await redis.incr(UNIQUE_USER_COUNT_KEY);

    await notifyDiscord(`👤 **New Orbis user** (#${total}): ${user.login}`);
  } catch (err) {
    // Never let telemetry break the actual sign-in flow.
    console.error("recordUniqueGithubUser failed:", err);
  }
}

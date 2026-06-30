import chalk from "chalk";
import fs from "node:fs/promises";
import os from "os";
import path from "path";

export const CONFIG_DIR = path.join(os.homedir(), ".orbis");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

interface TokenData {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    scope?: string;
    expires_at: string | null;
    created_at: string;
}

export async function getStoredToken(): Promise<TokenData | null> {
    try {
        const data = await fs.readFile(TOKEN_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export async function storeToken(token: any): Promise<boolean> {
    try {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
        const tokenData: TokenData = {
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            token_type: token.token_type || "Bearer",
            scope: token.scope,
            expires_at: token.expires_in
                ? new Date(Date.now() + token.expires_in * 1000).toISOString()
                : null,
            created_at: new Date().toISOString()
        };
        await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
        return true;
    } catch (error: any) {
        console.error(chalk.red("Failed to store token:"), error.message);
        return false;
    }
}

export async function clearStoredToken(): Promise<boolean> {
    try {
        await fs.unlink(TOKEN_FILE);
        return true;
    } catch {
        return false;
    }
}

export async function isTokenExpired(): Promise<boolean> {
    const token = await getStoredToken();
    if (!token) return true;

    // No expiry info means the provider issued a non-expiring token
    if (!token.expires_at) return false;

    const expiresAt = new Date(token.expires_at);
    return expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
}

export async function requireAuth(): Promise<TokenData> {
    const token = await getStoredToken();
    if (!token) {
        console.log(chalk.red("Not authenticated. Please run 'orbis login' first."));
        process.exit(1);
    }
    if (await isTokenExpired()) {
        console.log(chalk.yellow("Your token has expired. Please log in again."));
        console.log(chalk.gray("Run: orbis login\n"));
        process.exit(1);
    }
    return token!;
}
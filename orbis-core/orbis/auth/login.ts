import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import { Command } from "commander";
import open from "open";
import yoctoSpinner from "yocto-spinner";
import dotenv from "dotenv";
import { getStoredToken, isTokenExpired, storeToken, TOKEN_FILE } from "./token";

dotenv.config();

const SERVER_URL = process.env.AUTH_SERVER_URL || "https://orbis-ai-l2n7.onrender.com";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Ov23liPFq4TbmljONBZf";

export async function loginAction() {
    intro(chalk.cyan("Secure login for Orbis"));

    const existingToken = await getStoredToken();
    const expired = await isTokenExpired();

    if (existingToken && !expired) {
        const shouldReAuth = await confirm({
            message: "You are already logged in. Do you want to re-login?",
            initialValue: false
        });
        if (isCancel(shouldReAuth) || !shouldReAuth) {
            cancel("Login cancelled.");
            process.exit(0);
        }
    }

    const authClient = createAuthClient({
        baseURL: SERVER_URL,
        plugins: [deviceAuthorizationClient()]
    });

    const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
    spinner.start();

    try {
        const { data, error } = await authClient.device.code({
            client_id: CLIENT_ID,
            scope: "openid profile email"
        });
        spinner.stop();

        if (error || !data) {
            console.error(chalk.red("Failed to request device authorization."));
            process.exit(1);
        }

        const { device_code, user_code, verification_uri, interval = 5, expires_in } = data;

        console.log(chalk.cyan("\nDevice Authorization Requested"));
        console.log(`Visit:      ${chalk.underline.blue(verification_uri)}`);
        console.log(`Enter code: ${chalk.bold.green(user_code)}`);

        const shouldOpen = await confirm({
            message: "Open browser automatically?",
            initialValue: true
        });

        if (!isCancel(shouldOpen) && shouldOpen) {
            await open(`${verification_uri}?user_code=${user_code}`);
        }

        console.log(chalk.gray(`\nWaiting for authorization... (expires in ${Math.floor(expires_in / 60)} minutes)`));

        const token = await pollForToken(authClient, device_code, CLIENT_ID, interval);

        if (token) {
            const saved = await storeToken(token);
            if (!saved) {
                console.log(chalk.yellow("\nWarning: Could not save authentication token."));
            }
            outro(chalk.green("Successfully logged in."));
            console.log(chalk.gray(`\nToken saved to: ${TOKEN_FILE}`));
            console.log(chalk.gray("You can now use Orbis without logging in again.\n"));
        }
    } catch (error: any) {
        spinner.stop();
        console.error(chalk.red("Login failed:"), error.message);
        process.exit(1);
    }
}

async function pollForToken(authClient: any, deviceCode: string, clientId: string, initialInterval: number): Promise<any> {
    let pollingInterval = initialInterval;
    const spinner = yoctoSpinner({ text: "", color: "cyan" });
    let dots = 0;

    return new Promise((resolve) => {
        const poll = async () => {
            dots = (dots + 1) % 4;
            spinner.text = chalk.gray(`Waiting for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`);
            if (!spinner.isSpinning) spinner.start();

            try {
                const { data, error } = await authClient.device.token({
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                    device_code: deviceCode,
                    client_id: clientId,
                    fetchOptions: { headers: { "user-agent": "orbis-cli" } },
                });

                if (data?.access_token) {
                    spinner.stop();
                    resolve(data);
                    return;
                } else if (error) {
                    switch (error.error) {
                        case "authorization_pending": break;
                        case "slow_down": pollingInterval += 5; break;
                        case "access_denied":
                            spinner.stop();
                            console.error(chalk.red("Access was denied."));
                            process.exit(1);
                        case "expired_token":
                            spinner.stop();
                            console.error(chalk.red("Device code expired. Please try again."));
                            process.exit(1);
                        default:
                            spinner.stop();
                            process.exit(1);
                    }
                }
            } catch (error: any) {
                spinner.stop();
                console.error(chalk.red("Network error:"), error.message);
                process.exit(1);
            }

            setTimeout(poll, pollingInterval * 1000);
        };

        setTimeout(poll, pollingInterval * 1000);
    });
}

export const login = new Command("login")
    .description("Login to Orbis")
    .action(loginAction);
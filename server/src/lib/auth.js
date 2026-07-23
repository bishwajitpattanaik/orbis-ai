import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db.js";
import { bearer, deviceAuthorization } from "better-auth/plugins";
import { recordUniqueGithubUser } from "../routes/telemetry-github-user.js";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    baseURL: "https://orbis-ai-l2n7.onrender.com",
    basePath: "/api/auth",
    trustedOrigins: [
        "http://localhost:3000",
        "https://orbis-ai-bishwajitpattanaik.vercel.app",
    ],
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
        },
    },
    plugins: [
        bearer(),
        deviceAuthorization({
            verificationUri: "/device",
        }),
    ],
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
    },
    databaseHooks: {                   
        user: {
            create: {
                after: async (user) => {
                    await recordUniqueGithubUser({
                        id: user.id,
                        login: user.name ?? user.email ?? user.id,
                    });
                },
            },
        },
    },
});
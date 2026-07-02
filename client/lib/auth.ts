import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { deviceAuthorization } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    baseURL: process.env.BETTER_AUTH_URL || "https://orbis-ai-l2n7.onrender.com",
    trustedOrigins: [
        "http://localhost:3000",
        "https://orbis-ai-bishwajitpattanaik.vercel.app",
        "https://orbis-ai-l2n7.onrender.com",
    ],
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
    plugins: [
        deviceAuthorization({ 
            verificationUri: "/device",
        }),
    ],
});
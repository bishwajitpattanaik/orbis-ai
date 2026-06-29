import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { deviceAuthorization } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    trustedOrigins: [
        "http://localhost:3000",
        "https://orbis-ai-bishwajitpattanaik.vercel.app",
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
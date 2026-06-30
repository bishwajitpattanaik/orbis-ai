import dotenv from "dotenv";
dotenv.config();

const SERVER_URL = process.env.AUTH_SERVER_URL || "https://orbis-ai-l2n7.onrender.com";

export interface OrbisUser {
    id: string;
    name: string;
    email: string;
}

export async function getUserFromToken(accessToken: string): Promise<OrbisUser | null> {
    try {
        const res = await fetch(`${SERVER_URL}/api/auth/get-session`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) return null;

        const data = await res.json();

        const user = data?.user || data?.session?.user || data;
        if (!user?.id) return null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
        };
    } catch {
        return null;
    }
}
import { getStoredToken } from "../auth/token.ts";
import dotenv from "dotenv";
dotenv.config();

const SERVER_URL = process.env.AUTH_SERVER_URL || "https://orbis-ai-l2n7.onrender.com";

async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getStoredToken();
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token?.access_token ?? ""}`,
        Cookie: `better-auth.session_token=${token?.access_token ?? ""}`,
    };
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${SERVER_URL}${path}`, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    return res.json();
}

export class ChatService {

    async createConversation(userId: string, mode: string = "chat", title: string | null = null) {
        return apiFetch("/api/conversations", {
            method: "POST",
            body: JSON.stringify({ mode, title }),
        });
    }

    async getOrCreateConversation(userId: string, conversationId: string | null = null, mode: string = "chat") {
        if (conversationId) {
            try {
                const conversation = await apiFetch(`/api/conversations/${conversationId}`);
                if (conversation) return conversation;
            } catch {
                // not found, create new
            }
        }
        return this.createConversation(userId, mode);
    }

    async addMessage(conversationId: string, role: string, content: string | object) {
        return apiFetch(`/api/conversations/${conversationId}/messages`, {
            method: "POST",
            body: JSON.stringify({ role, content }),
        });
    }

    async getMessages(conversationId: string) {
        const messages = await apiFetch(`/api/conversations/${conversationId}/messages`);
        return messages.map((msg: any) => ({
            ...msg,
            content: this.parseContent(msg.content),
        }));
    }

    async getUserConversations(userId: string) {
        return apiFetch("/api/conversations");
    }

    async deleteConversation(conversationId: string, userId: string) {
        return apiFetch(`/api/conversations/${conversationId}`, {
            method: "DELETE",
        });
    }

    async updateTitle(conversationId: string, title: string) {
        return apiFetch(`/api/conversations/${conversationId}/title`, {
            method: "PATCH",
            body: JSON.stringify({ title }),
        });
    }

    parseContent(content: string) {
        try {
            return JSON.parse(content);
        } catch {
            return content;
        }
    }

    formatMessagesForAI(messages: any[]) {
        return messages.map((msg) => ({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        }));
    }
}
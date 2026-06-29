import express from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// ── Auth middleware ────────────────────────────────────────────────────────────
async function requireSession(req, res, next) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/conversations — get all conversations for user
router.get("/", requireSession, async (req, res) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        res.json(conversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/conversations — create a new conversation
router.post("/", requireSession, async (req, res) => {
    const { mode = "chat", title } = req.body;
    try {
        const conversation = await prisma.conversation.create({
            data: {
                userId: req.user.id,
                mode,
                title: title || `New ${mode} conversation`,
            },
        });
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/conversations/:id — get a conversation with messages
router.get("/:id", requireSession, async (req, res) => {
    try {
        const conversation = await prisma.conversation.findFirst({
            where: { id: req.params.id, userId: req.user.id },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
            },
        });
        if (!conversation) return res.status(404).json({ error: "Not found" });
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/conversations/:id/title — update title
router.patch("/:id/title", requireSession, async (req, res) => {
    const { title } = req.body;
    try {
        const conversation = await prisma.conversation.update({
            where: { id: req.params.id },
            data: { title },
        });
        res.json(conversation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/conversations/:id — delete a conversation
router.delete("/:id", requireSession, async (req, res) => {
    try {
        await prisma.conversation.deleteMany({
            where: { id: req.params.id, userId: req.user.id },
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/conversations/:id/messages — get messages
router.get("/:id/messages", requireSession, async (req, res) => {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId: req.params.id },
            orderBy: { createdAt: "asc" },
        });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/conversations/:id/messages — add a message
router.post("/:id/messages", requireSession, async (req, res) => {
    const { role, content } = req.body;
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    try {
        const message = await prisma.message.create({
            data: {
                conversationId: req.params.id,
                role,
                content: contentStr,
            },
        });
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

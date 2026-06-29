import prisma from "../lib/db.js";


export class ChatService {
    /**
     * Create a new Conversation
     * @param {string} userId - User ID
     * @param {string} mode - chat, tool, or agent 
     * @param {string} title - Optional conversation title
     */

    async createConversation(userId, mode = "chat", title = null) {
        return prisma.conversation.create({
            data: {
                userId,
                mode,
                title: title || `New ${mode} conversation`
            }
        })
    }

    /**
     * Get or Create a conversation for user
     * @param {string} userId - User ID
     * @param {string} conversationId - Optional Conversation ID
     * @param {string} mode - chat, tool, or agent
     */

    async getOrCreateConversation(userId, conversationId = null, mode = "chat") {
        if (conversationId) {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userId
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            });
            if (conversation) return conversation;
        }

        return await this.createConversation(userId, mode);
    }

    /**
     * @param {string} conversationId - Conversation ID
     * @param {string} role - 'user' or 'assistant'
     * @param {string|object} content - Message content
     */

    async addMessage(conversationId, role, content) {
        // Convert content to JSON string if it's an object
        const contentStr = typeof content === "string"
            ? content
            : JSON.stringify(content);

        return await prisma.message.create({
            data: {
                conversationId,
                role,
                content: contentStr
            }
        })
    }

    /**
     * @param {string} conversationId - Conversation ID
     */

    async getMessages(conversationId) {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Parse JSON content back to object if needed
        return messages.map((msg) => ({
            ...msg,
            content: this.parseContent(msg.content),
        }));
    }

    /**
     * @param {string} userId - User ID
     * 
     **/

    async getUserConversation(userId) {
        return await prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }


    /**
     * Delete a conversation
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID (for security)
     */

    async deleteConversation(conversationId, userId) {
        return await prisma.conversation.deleteMany({
            where: {
                id: conversationId,
                userId,
            },
        });
    }

    /**
     * Update conversation title
     * @param {string} conversationId - Conversation ID
     * @param {string} userId - User ID (for security)
     * @param {string} title - New title
     */

    async updateTitle(conversationId, title) {
        return await prisma.conversation.update({
            where: { id: conversationId },
            data: { title },
        });
    }

    /**
     * Helper to parse content (JSON or string)
     */

    parseContent(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            return content;
        }
    }

    /**
     * Format messages for AI SDK
     * @param {Array} messages - Array of message objects
     */

    formatMessagesForAI(messages) {
        return messages.map((msg) => ({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
        }));
    }
}
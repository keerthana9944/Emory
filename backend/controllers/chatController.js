const Conversation = require("../models/Conversation");
const { Ollama } = require("ollama");
const mongoose = require("mongoose");

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434"
});

const getModelName = () => process.env.MODEL;

const normalizeMessages = (messages) => messages.map((message) => ({
    role: message.role,
    content: message.content
}));

const getReplyFromOllama = async (messages) => {
    const model = getModelName();

    if (!model) {
        throw createHttpError(500, "MODEL environment variable is missing.");
    }

    let response;

    try {
        response = await ollama.chat({
            model,
            messages: normalizeMessages(messages)
        });
    } catch {
        throw createHttpError(502, "Failed to connect to Ollama. Ensure Ollama is running.");
    }

    const reply = response?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
        throw createHttpError(502, "The model returned an invalid response.");
    }

    return reply;
};

exports.sendMessage = async (req, res) => {
    const { message, conversationId } = req.body;

    if (typeof message !== "string" || !message.trim()) {
        throw createHttpError(400, "A non-empty message is required.");
    }

    if (!getModelName()) {
        throw createHttpError(500, "MODEL environment variable is missing.");
    }

    let conversation;

    if (conversationId) {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            throw createHttpError(400, "Invalid conversationId format.");
        }

        conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            throw createHttpError(404, "Conversation not found.");
        }
    }

    if (!conversation) {
        conversation = new Conversation({ messages: [] });
    }

    conversation.messages.push({
        role: "user",
        content: message.trim()
    });

    const reply = await getReplyFromOllama(conversation.messages);

    conversation.messages.push({
        role: "assistant",
        content: reply
    });

    await conversation.save();

    res.status(200).json({
        conversationId: conversation._id,
        reply
    });
};

exports.getConversation = async(req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw createHttpError(400, "Invalid conversation id.");
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
        throw createHttpError(404, "Conversation not found.");
    }

    res.json(conversation);
};

exports.getAllConversations = async (req, res) => {
    const conversations = await Conversation.find({}).sort({ updatedAt: -1}).lean();
    res.json(conversations);
};

exports.deleteConversation = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw createHttpError(400, "Invalid conversation id.");
    }

    const deletedConversation = await Conversation.findByIdAndDelete(req.params.id);

    if (!deletedConversation) {
        throw createHttpError(404, "Conversation not found.");
    }

    res.json({ message: "Conversation deleted successfully." });
};
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

const getModelName = () => process.env.MODEL || process.env.AI_MODEL;

const normalizeMessages = (messages) => messages.map((message) => ({
    role: message.role,
    content: message.content
}));

const getReplyFromHostedApi = async (messages) => {
    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
    const model = getModelName();

    if (!apiKey) {
        throw createHttpError(500, "AI_API_KEY is missing for hosted model requests.");
    }

    if (!model) {
        throw createHttpError(500, "MODEL (or AI_MODEL) environment variable is missing.");
    }

    let response;

    try {
        response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: normalizeMessages(messages)
            })
        });
    } catch {
        throw createHttpError(502, "Failed to connect to hosted model provider.");
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw createHttpError(502, "Hosted model provider returned a non-JSON response.");
    }

    if (!response.ok) {
        const providerMessage = data?.error?.message || data?.message || "Hosted model request failed.";
        throw createHttpError(response.status, providerMessage);
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
        throw createHttpError(502, "Hosted model provider returned an invalid response.");
    }

    return reply;
};

const getReplyFromOllama = async (messages) => {
    const model = getModelName();

    if (!model) {
        throw createHttpError(500, "MODEL (or AI_MODEL) environment variable is missing.");
    }

    let response;

    try {
        response = await ollama.chat({
            model,
            messages: normalizeMessages(messages)
        });
    } catch {
        throw createHttpError(502, "Failed to connect to Ollama. Set AI_API_KEY for cloud deployments, or ensure Ollama is running.");
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
        throw createHttpError(500, "MODEL (or AI_MODEL) environment variable is missing.");
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

    const reply = process.env.AI_API_KEY
        ? await getReplyFromHostedApi(conversation.messages)
        : await getReplyFromOllama(conversation.messages);

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
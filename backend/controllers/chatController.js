const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getModelName = () => process.env.MODEL;

const getAIProvider = () => {
    const apiKeyPresent = Boolean(process.env.AI_API_KEY?.trim());
    const configuredProvider = process.env.AI_PROVIDER?.trim().toLowerCase();

    if (configuredProvider && configuredProvider !== "openai" && configuredProvider !== "openai-compatible") {
        throw createHttpError(500, `Unsupported AI_PROVIDER value: ${configuredProvider}. This project now only supports the OpenAI-compatible provider.`);
    }

    if (!apiKeyPresent) {
        throw createHttpError(500, "AI_API_KEY environment variable is missing.");
    }

    return "openai-compatible";
};

const getOpenAIBaseUrl = () => (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

const normalizeMessages = (messages) => messages.map((message) => ({
    role: message.role,
    content: message.content
}));

const getReplyFromOpenAICompatible = async (messages) => {
    const model = getModelName();

    if (!model) {
        throw createHttpError(500, "MODEL environment variable is missing.");
    }

    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
        throw createHttpError(500, "AI_API_KEY environment variable is missing.");
    }

    const response = await fetch(`${getOpenAIBaseUrl()}/chat/completions`, {
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

    if (!response.ok) {
        let responseBody = "";

        try {
            responseBody = await response.text();
        } catch {
            responseBody = "";
        }

        const message = responseBody.trim() || response.statusText || "Unknown AI provider error.";
        throw createHttpError(response.status, `AI provider request failed: ${message}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
        throw createHttpError(502, "The model returned an invalid response.");
    }

    return reply;
};

const getReplyFromAIProvider = async (messages) => {
    getAIProvider();

    return getReplyFromOpenAICompatible(messages);
};

exports.sendMessage = async (req, res) => {
    const { message, conversationId } = req.body;

    // Runtime diagnostics: log provider selection and model without revealing secrets.
    try {
        console.log(`AI runtime -> provider=${getAIProvider()}, model=${getModelName()}, hasApiKey=${Boolean(process.env.AI_API_KEY?.trim())}`);
    } catch (e) {
        console.log("AI runtime -> provider detection failed", e?.message || e);
    }
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

    const reply = await getReplyFromAIProvider(conversation.messages);

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
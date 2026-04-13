const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    role:{
        type: String,
        enum: ["user", "assistant"],
        required: true
    },

    content:{
        type: String,
        required: true
    }
},
{timestamps: true});

const conversationSchema = new mongoose.Schema({
    messages: [messageSchema]
},

{timestamps: true});

module.exports = mongoose.model("Conversation", conversationSchema);
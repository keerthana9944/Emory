const router = require("express").Router();

const{ sendMessage, getConversation, getAllConversations, deleteConversation } = require("../controllers/chatController");

router.post("/", sendMessage);
router.get("/", getAllConversations);
router.get("/:id", getConversation);
router.delete("/:id", deleteConversation);

module.exports = router;
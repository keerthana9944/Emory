const router = require("express").Router();

const{ sendMessage, getConversation, getAllConversations } = require("../controllers/chatController");

router.post("/", sendMessage);
router.get("/", getAllConversations);
router.get("/:id", getConversation);

module.exports = router;
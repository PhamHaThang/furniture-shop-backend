const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

// ========== AI CHATBOT ROUTES (All need authentication) ==========

// [POST] /api/chat/message - Gửi tin nhắn và nhận phản hồi từ AI
router.post("/message", protect, chatController.sendMessage);

// [GET] /api/chat/sessions - Lấy danh sách sessions
router.get("/sessions", protect, chatController.getChatSessions);

// [DELETE] /api/chat/sessions/clear - Xóa tất cả lịch sử chat
router.delete("/sessions/clear", protect, chatController.clearAllChatHistory);

// [GET] /api/chat/history/:sessionId - Lấy lịch sử chat theo session
router.get("/history/:sessionId", protect, chatController.getChatHistory);

// [DELETE] /api/chat/history/:sessionId - Xóa lịch sử chat theo session
router.delete("/history/:sessionId", protect, chatController.deleteChatHistory);

// [PUT] /api/chat/sessions/:sessionId/close - Đóng session
router.put("/sessions/:sessionId/close", protect, chatController.closeSession);

module.exports = router;

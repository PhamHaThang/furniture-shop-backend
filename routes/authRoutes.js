const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

// ========= AUTHENTICATION ROUTES ==========
// [POST] /api/auth/register - Đăng ký tài khoản
router.post("/register", authController.register);

// [POST] /api/auth/login - Đăng nhập tài khoản
router.post("/login", authController.login);

// [GET] /api/auth/me - Lấy thông tin người dùng hiện tại
router.get("/me", protect, authController.getMe);

// [POST] /api/auth/forgot-password - Yêu cầu đặt lại mật khẩu
router.post("/forgot-password", authController.forgotPassword);
// [POST] /api/auth/reset-password - Đặt lại mật khẩu
router.post("/reset-password", authController.resetPassword);

module.exports = router;

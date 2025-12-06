const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, requireRole } = require("../middlewares/authMiddleware");
const { uploadImage } = require("../middlewares/uploadMiddleware");

// ========= USER PROFILE ROUTES ==========
// [GET, PUT] /api/users/me - Lấy và cập nhật thông tin người dùng hiện tại
router
  .route("/me")
  .get(protect, userController.getProfile)
  .put(protect, userController.updateProfile);

// [POST] /api/users/me/avatar - Upload avatar
router.post("/me/avatar", protect, uploadImage, userController.uploadAvatar);

// [PUT] /api/users/me/password - Đổi mật khẩu
router.put("/me/password", protect, userController.changePassword);

// [GET, POST] /api/users/me/address - Lấy và thêm địa chỉ
router
  .route("/me/address")
  .get(protect, userController.getAddresses)
  .post(protect, userController.addAddress);

// [PUT, DELETE] /api/users/me/address/:id - Cập nhật và xóa địa chỉ
router
  .route("/me/address/:id")
  .put(protect, userController.updateAddress)
  .delete(protect, userController.deleteAddress);

module.exports = router;

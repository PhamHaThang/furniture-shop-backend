const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const { protect, requireRole } = require("../middlewares/authMiddleware");
const {
  uploadImage,
  uploadMultipleImages,
  upload3DModel,
} = require("../middlewares/uploadMiddleware");

// ========== UPLOAD ROUTES (Admin only) ==========

// [POST] /api/upload/image - Upload single image
router.post(
  "/image",
  protect,
  requireRole("admin"),
  uploadImage,
  uploadController.uploadImage
);

// [POST] /api/upload/images - Upload multiple images (max 10)
router.post(
  "/images",
  protect,
  requireRole("admin"),
  uploadMultipleImages,
  uploadController.uploadMultipleImages
);

// [POST] /api/upload/3d-model - Upload 3D model
router.post(
  "/3d-model",
  protect,
  requireRole("admin"),
  upload3DModel,
  uploadController.upload3DModel
);

// [DELETE] /api/upload/delete - Delete single file
router.delete(
  "/delete",
  protect,
  requireRole("admin"),
  uploadController.deleteFile
);

// [DELETE] /api/upload/delete-multiple - Delete multiple files
router.delete(
  "/delete-multiple",
  protect,
  requireRole("admin"),
  uploadController.deleteMultipleFiles
);

module.exports = router;

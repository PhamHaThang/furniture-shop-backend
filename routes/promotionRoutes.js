const express = require("express");
const router = express.Router();
const {
  getAllPromotions,
  validatePromotionCode,
  getPromotionByCode,
} = require("../controllers/promotionController");

// ========== PUBLIC ROUTES ==========

// [GET] /api/promotions - Lấy tất cả khuyến mãi đang hoạt động
router.get("/", getAllPromotions);

// [POST] /api/promotions/validate - Kiểm tra mã khuyến mãi
router.post("/validate", validatePromotionCode);

module.exports = router;

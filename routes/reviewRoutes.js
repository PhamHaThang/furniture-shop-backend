const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const reviewController = require("../controllers/reviewController");

// ========== PUBLIC ROUTES ==========
// [GET] /api/reviews/product/:productId - Lấy đánh giá theo ID sản phẩm
router.get("/product/:productId", reviewController.getReviewsByProduct);

// ========== USER ROUTES ==========
// [POST] /api/reviews - Tạo đánh giá cho sản phẩm
router.post("/", protect, reviewController.createReview);
// [PUT] /api/reviews/:id - Cập nhật đánh giá
router.put("/:id", protect, reviewController.updateReview);
// [DELETE] /api/reviews/:id - Xóa đánh giá
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;

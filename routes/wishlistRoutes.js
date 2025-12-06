const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const { protect } = require("../middlewares/authMiddleware");

// ========== USER WISHLIST ROUTES ==========
router.use(protect);
// [GET] /api/wishlist - Lấy danh sách yêu thích
router.get("/", wishlistController.getWishlist);

// [DELETE] /api/wishlist - Xóa toàn bộ danh sách yêu thích
router.delete("/", wishlistController.clearWishlist);

// [POST] /api/wishlist/:productId - Thêm sản phẩm vào yêu thích
router.post("/:productId", wishlistController.addToWishlist);

// [DELETE] /api/wishlist/:productId - Xóa sản phẩm khỏi yêu thích
router.delete("/:productId", wishlistController.removeFromWishlist);

module.exports = router;

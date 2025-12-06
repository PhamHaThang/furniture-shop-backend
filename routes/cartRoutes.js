const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyDiscount,
  removeDiscount,
} = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");

router.use(protect);

// [GET] /api/cart - Lấy giỏ hàng
router.get("/", getCart);

// [DELETE] /api/cart - Xóa toàn bộ giỏ hàng
router.delete("/", clearCart);

// [POST] /api/cart/items - Thêm sản phẩm vào giỏ hàng
router.post("/items", addToCart);

// [PUT] /api/cart/items/:productId - Cập nhật số lượng sản phẩm
router.put("/items/:productId", updateCartItem);

// [DELETE] /api/cart/items/:productId - Xóa sản phẩm khỏi giỏ hàng
router.delete("/items/:productId", removeCartItem);

// [POST] /api/cart/discount - Áp dụng mã giảm giá
router.post("/discount", applyDiscount);

// [DELETE] /api/cart/discount - Xóa mã giảm giá
router.delete("/discount", removeDiscount);

module.exports = router;

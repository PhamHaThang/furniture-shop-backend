const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrderByCode,
} = require("../controllers/orderController");
const { protect } = require("../middlewares/authMiddleware");

// [GET] /api/orders - Lấy danh sách đơn hàng của user
router.get("/", protect, getMyOrders);

// [POST] /api/orders - Tạo đơn hàng mới
router.post("/", protect, createOrder);

// [GET] /api/orders/code/:code - Tra cứu đơn hàng theo mã (public, không cần auth)
router.get("/code/:code", getOrderByCode);

// [GET] /api/orders/:id - Lấy chi tiết đơn hàng theo ID
router.get("/:id", protect, getOrderById);

// [PUT] /api/orders/:id/cancel - Hủy đơn hàng
router.put("/:id/cancel", protect, cancelOrder);

module.exports = router;

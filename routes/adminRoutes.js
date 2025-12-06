const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const categoryController = require("../controllers/categoryController");
const brandController = require("../controllers/brandController");
const orderController = require("../controllers/orderController");
const reviewController = require("../controllers/reviewController");
const promotionController = require("../controllers/promotionController");
const { protect, requireRole } = require("../middlewares/authMiddleware");

router.use(protect, requireRole("admin"));

// ========== USER MANAGEMENT ==========
// [GET, POST] /api/admin/users - Lấy tất cả người dùng và tạo người dùng mới
router
  .route("/users")
  .get(userController.getAllUsers)
  .post(userController.createUser);

// [GET, PUT, DELETE] /api/admin/users/:id - Lấy, cập nhật và xóa người dùng theo ID
router
  .route("/users/:id")
  .get(userController.getUserById)
  .put(userController.updateUserById)
  .delete(userController.deleteUserById);

// ========== PRODUCT MANAGEMENT ==========
// [GET, POST] /api/admin/products - Lấy tất cả sản phẩm và tạo sản phẩm mới
router
  .route("/products")
  .get(productController.getAllProducts)
  .post(productController.createProduct);

// [GET, PUT, DELETE] /api/admin/products/:id - Lấy, cập nhật và xóa sản phẩm theo ID
router
  .route("/products/:id")
  .get(productController.getProductById)
  .put(productController.updateProduct)
  .delete(productController.deleteProduct);

// ========== CATEGORY MANAGEMENT ==========
// [GET, POST] /api/admin/categories - Lấy tất cả danh mục và tạo danh mục mới
router
  .route("/categories")
  .get(categoryController.getAllCategoriesAdmin)
  .post(categoryController.createCategory);

// [PUT, DELETE] /api/admin/categories/:id - Cập nhật và xóa danh mục theo ID
router
  .route("/categories/:id")
  .put(categoryController.updateCategoryById)
  .delete(categoryController.deleteCategoryById);

// ========== BRAND MANAGEMENT ==========
// [GET, POST] /api/admin/brands - Lấy tất cả thương hiệu và tạo thương hiệu mới
router
  .route("/brands")
  .get(brandController.getAllBrandsAdmin)
  .post(brandController.createBrand);

// [PUT, DELETE] /api/admin/brands/:id - Cập nhật và xóa thương hiệu theo ID
router
  .route("/brands/:id")
  .put(brandController.updateBrand)
  .delete(brandController.deleteBrand);

// ========== ORDER MANAGEMENT ==========
// [GET] /api/admin/orders - Lấy danh sách tất cả đơn hàng
router.get("/orders", orderController.getAllOrders);

// [GET] /api/admin/orders/stats - Thống kê đơn hàng
router.get("/orders/stats", orderController.getOrderStats);

// [GET, DELETE] /api/admin/orders/:id - Lấy chi tiết và xóa đơn hàng theo ID
router
  .route("/orders/:id")
  .get(orderController.getOrderByIdAdmin)
  .delete(orderController.deleteOrder);

// [PUT] /api/admin/orders/:id/status - Cập nhật trạng thái đơn hàng
router.put("/orders/:id/status", orderController.updateOrderStatus);

// [PUT] /api/admin/orders/:id/payment-status - Cập nhật trạng thái thanh toán đơn hàng
router.put("/orders/:id/payment-status", orderController.updatePaymentStatus);

// ========== REVIEW MANAGEMENT ==========
// [GET] /api/admin/reviews - Lấy tất cả đánh giá
router.get("/reviews", reviewController.getAllReviews);
// [DELETE] /api/admin/reviews/:id - Xóa đánh giá
router.delete("/reviews/:id", reviewController.adminDeleteReview);

// ========== PROMOTION MANAGEMENT ==========
// [GET, POST] /api/admin/promotions - Lấy tất cả khuyến mãi và tạo khuyến mãi mới
router
  .route("/promotions")
  .get(promotionController.getAllPromotionsAdmin)
  .post(promotionController.createPromotion);

// [GET, PUT, DELETE] /api/admin/promotions/:id - Lấy, cập nhật và xóa khuyến mãi theo ID
router
  .route("/promotions/:id")
  .get(promotionController.getPromotionByIdAdmin)
  .put(promotionController.updatePromotion)
  .delete(promotionController.deletePromotion);

module.exports = router;

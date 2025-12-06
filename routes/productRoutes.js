const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// ========== PUBLIC ROUTES ==========

// GET /api/products - Lấy danh sách sản phẩm với filter
router.get("/", productController.getAllProducts);

// GET /api/products/featured - Sản phẩm nổi bật
router.get("/featured", productController.getFeaturedProducts);

// GET /api/products/new-arrivals - Sản phẩm mới
router.get("/new-arrivals", productController.getNewArrivals);

// GET /api/products/best-sellers - Sản phẩm bán chạy
router.get("/best-sellers", productController.getBestSellers);

// GET /api/products/related/:productId - Sản phẩm liên quan
router.get("/related/:productId", productController.getRelatedProducts);

// GET /api/products/:slug - Lấy sản phẩm theo slug
router.get("/:slug", productController.getProductBySlug);

module.exports = router;

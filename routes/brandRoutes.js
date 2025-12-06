const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");

// [GET] /api/brands - Lấy tất cả thương hiệu
router.get("/", brandController.getAllBrands);

// [GET] /api/brands/popular - Lấy thương hiệu phổ biến
router.get("/popular", brandController.getPopularBrands);

// [GET] /api/brands/:slug - Lấy thương hiệu theo slug
router.get("/:slug", brandController.getBrandBySlug);

module.exports = router;

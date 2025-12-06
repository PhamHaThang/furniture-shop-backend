const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryBySlug,
  getCategoryTree,
} = require("../controllers/categoryController");

// [GET] /api/categories - Lấy tất cả danh mục (có thể filter parent, pagination)
router.get("/", getAllCategories);

// [GET] /api/categories/tree - Lấy cấu trúc cây danh mục
router.get("/tree", getCategoryTree);

// [GET] /api/categories/:slug - Lấy danh mục theo slug
router.get("/:slug", getCategoryBySlug);

module.exports = router;

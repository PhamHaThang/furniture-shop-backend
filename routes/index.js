const express = require("express");
const router = express.Router();
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const brandRoutes = require("./brandRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const reviewRoutes = require("./reviewRoutes");
const promotionRoutes = require("./promotionRoutes");
const wishlistRoutes = require("./wishlistRoutes");
const uploadRoutes = require("./uploadRoutes");

const adminRoutes = require("./adminRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/reviews", reviewRoutes);
router.use("/promotions", promotionRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/upload", uploadRoutes);

router.use("/admin", adminRoutes);

module.exports = router;

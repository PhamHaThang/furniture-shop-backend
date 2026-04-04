const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/health", recommendationController.getMLHealth);
router.get(
    "/product/:productId/similar",
    recommendationController.getSimilarByProduct,
);

router.use(protect);
router.get("/me/content-based", recommendationController.getContentBasedForMe);
router.get("/me/collaborative", recommendationController.getCollaborativeForMe);
router.get("/me/hybrid", recommendationController.getHybridForMe);

module.exports = router;

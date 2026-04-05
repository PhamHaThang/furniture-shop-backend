const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const {
    callMLService,
    checkMLServiceHealth,
} = require("../services/mlService");

const {
    buildMLRequest,
    formatRecommendations,
} = require("../utils/recommendationHelper");

exports.getMLHealth = asyncHandler(async (req, res) => {
    const healthStatus = await checkMLServiceHealth();
    res.json({
        success: true,
        message: "ML service is healthy",
        healthStatus,
    });
});

exports.getContentBasedForMe = asyncHandler(async (req, res) => {
    const topK = Number(req.query.limit) || 8;
    const request = await buildMLRequest({
        targetUserId: req.user._id.toString(),
        topK,
        includeProducts: true,
        includeReviews: true,
        includeOrders: true,
    });

    const result = await callMLService("/recommend/content-based", request);
    const mapped = formatRecommendations(
        result.recommendations || [],
        request.products,
    );

    res.json({
        success: true,
        message: "Content-based recommendations generated",
        model: result.model,
        recommendations: mapped,
    });
});

exports.getCollaborativeForMe = asyncHandler(async (req, res) => {
    const topK = Number(req.query.limit) || 8;
    const request = await buildMLRequest({
        targetUserId: req.user._id.toString(),
        topK,
        includeReviews: true,
        includeOrders: true,
    });

    const result = await callMLService("/recommend/collaborative", request);
    const mapped = formatRecommendations(
        result.recommendations || [],
        request.products,
    );

    res.json({
        success: true,
        message: "Collaborative recommendations generated",
        model: result.model,
        recommendations: mapped,
    });
});

exports.getHybridForMe = asyncHandler(async (req, res) => {
    const topK = Number(req.query.limit) || 8;
    const request = await buildMLRequest({
        targetUserId: req.user._id.toString(),
        topK,
        includeProducts: true,
        includeReviews: true,
        includeOrders: true,
    });

    const result = await callMLService("/recommend/hybrid", request);
    const mapped = formatRecommendations(
        result.recommendations || [],
        request.products,
    );

    res.json({
        success: true,
        message: "Hybrid recommendations generated",
        model: result.model,
        weights: result.weights,
        recommendations: mapped,
    });
});

exports.getSimilarByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const topK = Number(req.query.limit) || 8;

    const existingProduct = await Product.findById(productId).lean();
    if (!existingProduct) {
        throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    const request = await buildMLRequest({
        targetProductId: productId,
        topK,
        includeProducts: true,
    });

    const result = await callMLService("/recommend/content-based", request);
    const mapped = formatRecommendations(
        result.recommendations || [],
        request.products,
    );

    res.json({
        success: true,
        message: "Similar products generated",
        model: result.model,
        recommendations: mapped,
    });
});
exports.getReviewSentimentAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const request = await buildMLRequest({
        startDate,
        endDate,
        includeReviews: true,
    });
    const result = await callMLService("/sentiment/reviews", request);

    res.json({
        success: true,
        message: "Review sentiment analytics generated",
        sentiment: result,
    });
});

exports.getKMeansClusters = asyncHandler(async (req, res) => {
    const clusterType =
        req.query.clusterType === "users" ? "users" : "products";
    const clusters = Number(req.query.clusters) || 4;
    const { startDate, endDate } = req.query;

    const request = await buildMLRequest({
        clusters,
        startDate,
        endDate,
        includeProducts: clusterType === "products",
        includeReviews: clusterType === "users",
        includeOrders: clusterType === "users",
    });
    const result = await callMLService("/cluster/kmeans", request, {
        cluster_type: clusterType,
    });

    res.json({
        success: true,
        message: "KMeans clustering generated",
        clustering: result,
    });
});

exports.getAdminMLDashboard = asyncHandler(async (req, res) => {
    const clusters = Number(req.query.clusters) || 4;
    const { startDate, endDate } = req.query;
    const request = await buildMLRequest({
        clusters,
        startDate,
        endDate,
        includeProducts: true,
        includeReviews: true,
        includeOrders: true,
    });
    const result = await callMLService("/analytics/admin", request);

    if (!result) {
        throw new AppError(
            500,
            "Unable to generate ML dashboard",
            "ML_DASHBOARD_ERROR",
        );
    }

    res.json({
        success: true,
        message: "ML dashboard generated",
        analytics: result,
    });
});

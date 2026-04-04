const Product = require("../models/Product");
const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");

const builDateRangeFilter = ({ startDate, endDate }) => {
    const createdAt = {};
    if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (!Number.isNaN(parsedStartDate.getTime())) {
            createdAt.$gte = parsedStartDate;
        }
        if (endDate) {
            const parsedEndDate = new Date(endDate);
            if (!Number.isNaN(parsedEndDate.getTime())) {
                createdAt.$lte = parsedEndDate;
            }
        }
        return Object.keys(createdAt).length > 0 ? { createdAt } : {};
    }
};
const buildMLRequest = async ({
    targetUserId,
    targetProductId,
    topK,
    clusters,
    startDate,
    endDate,
}) => {
    const dateRangeFilter = builDateRangeFilter({ startDate, endDate });
    const [users, products, reviews, orders] = await Promise.all([
        User.find({ isDeleted: false })
            .select("_id fullName role createdAt")
            .lean(),
        Product.find({ isDeleted: false })
            .populate("category", "name")
            .populate("brand", "name")
            .lean(),
        Review.find({ ...dateRangeFilter })
            .select("_id user product rating comment createdAt")
            .lean(),
        Order.find({ status: { $ne: "cancelled" }, ...dateRangeFilter })
            .select("_id user items totalAmount status createdAt")
            .lean(),
    ]);
    return {
        users,
        products,
        reviews,
        orders,
        target_user_id: targetUserId || null,
        target_product_id: targetProductId || null,
        top_k: Number(topK) || 8,
        clusters: Number(clusters) || 4,
    };
};
const formatRecommendations = (recommendations, products) => {
    const productMap = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    return recommendations
        .map((item) => {
            const product = productMap.get(String(item.product_id));
            if (!product) return null;

            return {
                product,
                score: Number(item.score || 0),
                model: item.model,
            };
        })
        .filter(Boolean);
};

module.exports = {
    builDateRangeFilter,
    buildMLRequest,
    formatRecommendations,
};

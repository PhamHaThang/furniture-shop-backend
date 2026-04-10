const Product = require("../models/Product");
const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");
const toPositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const ML_LIMITS = {
    users: toPositiveInt(process.env.ML_MAX_USERS, 1500),
    products: toPositiveInt(process.env.ML_MAX_PRODUCTS, 3000),
    reviews: toPositiveInt(process.env.ML_MAX_REVIEWS, 4000),
    orders: toPositiveInt(process.env.ML_MAX_ORDERS, 4000),
};
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
    includeUsers = false,
    includeProducts = false,
    includeReviews = false,
    includeOrders = false,
    usersLimit = ML_LIMITS.users,
    productsLimit = ML_LIMITS.products,
    reviewsLimit = ML_LIMITS.reviews,
    ordersLimit = ML_LIMITS.orders,
}) => {
    const dateRangeFilter = builDateRangeFilter({ startDate, endDate });
    const [users, products, reviews, orders] = await Promise.all([
        includeUsers
            ? User.find({ isDeleted: false })
                  .select("_id fullName role createdAt")
                  .sort({ createdAt: -1 })
                  .limit(usersLimit)
                  .lean()
            : [],
        includeProducts
            ? Product.find({ isDeleted: false })
                  .select(
                      "_id name description price averageRating totalReviews soldCount stock images model3DUrl tags colors materials category brand slug ",
                  )
                  .populate("category", "name")
                  .populate("brand", "name")
                  .sort({ createdAt: -1 })
                  .limit(productsLimit)
                  .lean()
            : [],
        includeReviews
            ? Review.find({ ...dateRangeFilter })
                  .select("_id user product rating comment createdAt")
                  .sort({ createdAt: -1 })
                  .limit(reviewsLimit)
                  .lean()
            : [],
        includeOrders
            ? Order.find({ status: { $ne: "cancelled" }, ...dateRangeFilter })
                  .select("_id user items totalAmount status payment createdAt")
                  .sort({ createdAt: -1 })
                  .limit(ordersLimit)
                  .lean()
            : [],
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

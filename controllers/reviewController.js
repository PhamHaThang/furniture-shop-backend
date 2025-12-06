const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");

// Helper function: Cập nhật rating của product
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });

  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: reviews.length,
  });
};

// ========== PUBLIC ROUTES ==========

// [GET] /api/reviews/product/:productId - Lấy đánh giá của sản phẩm
exports.getReviewsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, rating, sortBy = "-createdAt" } = req.query;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  const query = { product: productId };

  // Filter by rating
  if (rating) {
    query.rating = Number(rating);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const reviews = await Review.find(query)
    .populate("user", "fullName avatar")
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Review.countDocuments(query);

  // Rating statistics
  const ratingStats = await Review.aggregate([
    { $match: { product: new require("mongoose").Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  res.json({
    success: true,
    message: "Lấy danh sách đánh giá thành công",
    reviews,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    ratingStats,
  });
});

// ========== USER ROUTES ==========

// [POST] /api/reviews - Tạo đánh giá cho sản phẩm
exports.createReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, rating, comment } = req.body;

  if (!productId || !rating || !comment) {
    throw new AppError(
      400,
      "Vui lòng cung cấp đầy đủ thông tin đánh giá",
      "MISSING_FIELDS"
    );
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new AppError(400, "Đánh giá phải từ 1 đến 5 sao", "INVALID_RATING");
  }

  // Check product tồn tại
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  // Check user đã mua sản phẩm chưa
  const hasPurchased = await Order.findOne({
    user: userId,
    "items.product": productId,
    status: "delivered",
  });

  if (!hasPurchased) {
    throw new AppError(
      403,
      "Bạn chỉ có thể đánh giá sản phẩm đã mua",
      "NOT_PURCHASED"
    );
  }

  // Check đã review chưa
  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (existingReview) {
    throw new AppError(
      400,
      "Bạn đã đánh giá sản phẩm này rồi",
      "ALREADY_REVIEWED"
    );
  }

  // Tạo review
  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    comment,
  });

  // Update product rating
  await updateProductRating(productId);

  // Populate để trả về
  const populatedReview = await Review.findById(review._id)
    .populate("user", "fullName avatar")
    .populate("product", "name slug");

  res.status(201).json({
    success: true,
    message: "Tạo đánh giá thành công",
    review: populatedReview,
  });
});

// [PUT] /api/reviews/:id - Cập nhật đánh giá
exports.updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { rating, comment } = req.body;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError(404, "Đánh giá không tồn tại", "REVIEW_NOT_FOUND");
  }

  // Check quyền: User sở hữu
  if (review.user.toString() !== userId.toString()) {
    throw new AppError(
      403,
      "Bạn không có quyền cập nhật đánh giá này",
      "FORBIDDEN"
    );
  }

  // Validate rating
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError(400, "Đánh giá phải từ 1 đến 5 sao", "INVALID_RATING");
  }

  // Update fields
  review.rating = rating !== undefined ? rating : review.rating;
  review.comment = comment || review.comment;

  await review.save();

  // Update product rating
  await updateProductRating(review.product);

  // Populate để trả về
  const populatedReview = await Review.findById(review._id)
    .populate("user", "fullName avatar")
    .populate("product", "name slug");

  res.json({
    success: true,
    message: "Cập nhật đánh giá thành công",
    review: populatedReview,
  });
});

// [DELETE] /api/reviews/:id - Xóa đánh giá
exports.deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError(404, "Đánh giá không tồn tại", "REVIEW_NOT_FOUND");
  }

  // Check quyền: chỉ user sở hữu
  if (review.user.toString() !== userId.toString()) {
    throw new AppError(403, "Bạn không có quyền xóa đánh giá này", "FORBIDDEN");
  }

  const productId = review.product;

  await Review.findByIdAndDelete(id);

  // Update product rating
  await updateProductRating(productId);

  res.json({
    success: true,
    message: "Xóa đánh giá thành công",
  });
});

// ========== ADMIN ROUTES ==========

// [GET] /api/admin/reviews - Lấy tất cả đánh giá (có phân trang, filter)
exports.getAllReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    rating,
    productId,
    userId,
    search,
    sortBy = "-createdAt",
  } = req.query;

  const query = {};

  // Filter by rating
  if (rating) {
    query.rating = Number(rating);
  }

  // Filter by product
  if (productId) {
    query.product = productId;
  }

  // Filter by user
  if (userId) {
    query.user = userId;
  }

  // Search in comment
  if (search) {
    query.comment = { $regex: search, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const reviews = await Review.find(query)
    .populate("user", "fullName email avatar")
    .populate("product", "name slug images")
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Review.countDocuments(query);

  res.json({
    success: true,
    message: "Lấy danh sách đánh giá thành công",
    reviews,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// [DELETE] /api/admin/reviews/:id - Xóa đánh giá (admin)
exports.adminDeleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError(404, "Đánh giá không tồn tại", "REVIEW_NOT_FOUND");
  }

  const productId = review.product;

  await Review.findByIdAndDelete(id);

  // Update product rating
  await updateProductRating(productId);

  res.json({
    success: true,
    message: "Xóa đánh giá thành công",
  });
});

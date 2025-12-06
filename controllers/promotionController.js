const asyncHandler = require("express-async-handler");
const Promotion = require("../models/Promotion");
const AppError = require("../utils/AppError");

// ========== PUBLIC PROMOTION ROUTES ==========

// [GET] /api/promotions - Lấy tất cả khuyến mãi đang hoạt động
exports.getAllPromotions = asyncHandler(async (req, res) => {
  const now = new Date();

  const promotions = await Promotion.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    message: "Lấy danh sách khuyến mãi thành công",
    promotions,
  });
});

// [POST] /api/promotions/validate - Kiểm tra mã khuyến mãi
exports.validatePromotionCode = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    throw new AppError(400, "Mã khuyến mãi là bắt buộc", "MISSING_CODE");
  }

  const promotion = await Promotion.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!promotion) {
    throw new AppError(404, "Mã khuyến mãi không tồn tại", "INVALID_CODE");
  }

  const now = new Date();

  // Check ngày hiệu lực
  if (now < promotion.startDate) {
    return res.json({
      success: false,
      message: "Mã khuyến mãi chưa có hiệu lực",
      valid: false,
    });
  }

  if (now > promotion.endDate) {
    return res.json({
      success: false,
      message: "Mã khuyến mãi đã hết hạn",
      valid: false,
    });
  }

  // Check minSpend nếu có orderAmount
  if (orderAmount && promotion.minSpend && orderAmount < promotion.minSpend) {
    return res.json({
      success: false,
      message: `Đơn hàng tối thiểu ${promotion.minSpend.toLocaleString()}đ để áp dụng mã này`,
      valid: false,
      minSpend: promotion.minSpend,
    });
  }

  // Tính discount amount nếu có orderAmount
  let discountAmount = 0;
  if (orderAmount) {
    if (promotion.discountType === "percentage") {
      discountAmount = (orderAmount * promotion.discountValue) / 100;
    } else if (promotion.discountType === "fixed") {
      discountAmount = promotion.discountValue;
    }

    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }
  }

  res.json({
    success: true,
    message: "Mã khuyến mãi hợp lệ",
    valid: true,
    promotion: {
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      minSpend: promotion.minSpend,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
    },
    discountAmount,
  });
});

// ========== ADMIN PROMOTION ROUTES ==========

// [GET] /api/admin/promotions - Lấy tất cả khuyến mãi (dành cho admin)
exports.getAllPromotionsAdmin = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    isActive,
    search,
    sortBy = "-createdAt",
  } = req.query;

  const query = {};

  // Filter by isActive
  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  // Search by code or description
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const promotions = await Promotion.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Promotion.countDocuments(query);

  // Statistics
  const now = new Date();
  const activeCount = await Promotion.countDocuments({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  res.json({
    success: true,
    message: "Lấy danh sách khuyến mãi thành công",
    promotions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    stats: {
      activeCount,
      totalCount: total,
    },
  });
});

// [GET] /api/admin/promotions/:id - Lấy khuyến mãi theo ID (dành cho admin)
exports.getPromotionByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await Promotion.findById(id);

  if (!promotion) {
    throw new AppError(404, "Khuyến mãi không tồn tại", "PROMOTION_NOT_FOUND");
  }

  res.json({
    success: true,
    message: "Lấy thông tin khuyến mãi thành công",
    promotion,
  });
});

// [POST] /api/admin/promotions - Tạo khuyến mãi mới
exports.createPromotion = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    minSpend,
    isActive,
  } = req.body;

  // Validate required fields
  if (!code || !discountType || !discountValue || !startDate || !endDate) {
    throw new AppError(
      400,
      "Vui lòng cung cấp đầy đủ thông tin",
      "MISSING_FIELDS"
    );
  }

  // Validate discountType
  if (!["percentage", "fixed"].includes(discountType)) {
    throw new AppError(
      400,
      "Loại giảm giá không hợp lệ",
      "INVALID_DISCOUNT_TYPE"
    );
  }

  // Validate percentage value
  if (
    discountType === "percentage" &&
    (discountValue < 0 || discountValue > 100)
  ) {
    throw new AppError(
      400,
      "Phần trăm giảm giá phải từ 0 đến 100",
      "INVALID_PERCENTAGE"
    );
  }

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    throw new AppError(
      400,
      "Ngày kết thúc phải sau ngày bắt đầu",
      "INVALID_DATE_RANGE"
    );
  }

  // Check code đã tồn tại
  const existingPromotion = await Promotion.findOne({
    code: code.toUpperCase(),
  });
  if (existingPromotion) {
    throw new AppError(400, "Mã khuyến mãi đã tồn tại", "CODE_EXISTS");
  }

  // Tạo promotion
  const promotion = await Promotion.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    minSpend: minSpend || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({
    success: true,
    message: "Tạo khuyến mãi thành công",
    promotion,
  });
});

// [PUT] /api/admin/promotions/:id - Cập nhật khuyến mãi
exports.updatePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    minSpend,
    isActive,
  } = req.body;

  const promotion = await Promotion.findById(id);

  if (!promotion) {
    throw new AppError(404, "Khuyến mãi không tồn tại", "PROMOTION_NOT_FOUND");
  }

  // Check code trùng (nếu đổi code)
  if (code && code.toUpperCase() !== promotion.code) {
    const existingPromotion = await Promotion.findOne({
      code: code.toUpperCase(),
    });
    if (existingPromotion) {
      throw new AppError(400, "Mã khuyến mãi đã tồn tại", "CODE_EXISTS");
    }
  }

  // Validate discountType
  if (discountType && !["percentage", "fixed"].includes(discountType)) {
    throw new AppError(
      400,
      "Loại giảm giá không hợp lệ",
      "INVALID_DISCOUNT_TYPE"
    );
  }

  // Validate percentage value
  if (
    discountType === "percentage" &&
    discountValue &&
    (discountValue < 0 || discountValue > 100)
  ) {
    throw new AppError(
      400,
      "Phần trăm giảm giá phải từ 0 đến 100",
      "INVALID_PERCENTAGE"
    );
  }

  // Validate dates
  const newStartDate = startDate ? new Date(startDate) : promotion.startDate;
  const newEndDate = endDate ? new Date(endDate) : promotion.endDate;

  if (newStartDate >= newEndDate) {
    throw new AppError(
      400,
      "Ngày kết thúc phải sau ngày bắt đầu",
      "INVALID_DATE_RANGE"
    );
  }

  // Update fields
  promotion.code = code ? code.toUpperCase() : promotion.code;
  promotion.description =
    description !== undefined ? description : promotion.description;
  promotion.discountType = discountType || promotion.discountType;
  promotion.discountValue =
    discountValue !== undefined ? discountValue : promotion.discountValue;
  promotion.startDate = startDate || promotion.startDate;
  promotion.endDate = endDate || promotion.endDate;
  promotion.minSpend = minSpend !== undefined ? minSpend : promotion.minSpend;
  promotion.isActive = isActive !== undefined ? isActive : promotion.isActive;

  await promotion.save();

  res.json({
    success: true,
    message: "Cập nhật khuyến mãi thành công",
    promotion,
  });
});

// [DELETE] /api/admin/promotions/:id - Xóa khuyến mãi
exports.deletePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const promotion = await Promotion.findById(id);

  if (!promotion) {
    throw new AppError(404, "Khuyến mãi không tồn tại", "PROMOTION_NOT_FOUND");
  }

  await Promotion.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Xóa khuyến mãi thành công",
  });
});

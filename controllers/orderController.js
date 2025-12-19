const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Promotion = require("../models/Promotion");
const { generateOrderCode } = require("../utils/generateOrderCode");

// ========== ORDER ROUTES ==========

// [POST] /api/orders - Tạo đơn hàng mới
exports.createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod, discountCode, notes, transactionId } =
    req.body;

  // Validate shippingAddress
  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.province ||
    !shippingAddress.district ||
    !shippingAddress.ward ||
    !shippingAddress.address
  ) {
    throw new AppError(
      400,
      "Thông tin địa chỉ giao hàng không đầy đủ",
      "INVALID_ADDRESS"
    );
  }

  // Validate paymentMethod
  if (!paymentMethod || !["COD", "BANK"].includes(paymentMethod)) {
    throw new AppError(
      400,
      "Phương thức thanh toán không hợp lệ",
      "INVALID_PAYMENT_METHOD"
    );
  }

  // Validate transactionId nếu là BANK
  if (paymentMethod === "BANK" && !transactionId) {
    throw new AppError(
      400,
      "Vui lòng xác nhận thanh toán trước khi đặt hàng",
      "TRANSACTION_ID_REQUIRED"
    );
  }

  // Lấy giỏ hàng
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "Giỏ hàng trống", "CART_EMPTY");
  }

  // Validate stock và snapshot items
  const orderItems = [];
  let subTotal = 0;

  for (const item of cart.items) {
    if (!item.product) {
      throw new AppError(400, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
    }

    // Check stock
    if (item.product.stock < item.quantity) {
      throw new AppError(
        400,
        `Sản phẩm "${item.product.name}" chỉ còn ${item.product.stock} trong kho`,
        "INSUFFICIENT_STOCK"
      );
    }

    // Snapshot item data
    orderItems.push({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      image: item.product.images?.[0] || "",
    });

    subTotal += item.price * item.quantity;
  }

  // Apply discount nếu có
  let discount = { code: null, amount: 0 };

  if (discountCode) {
    const promotion = await Promotion.findOne({
      code: discountCode.toUpperCase(),
      isActive: true,
    });

    if (!promotion) {
      throw new AppError(
        404,
        "Mã giảm giá không hợp lệ",
        "INVALID_DISCOUNT_CODE"
      );
    }

    // Check ngày hiệu lực
    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      throw new AppError(400, "Mã giảm giá đã hết hạn", "DISCOUNT_EXPIRED");
    }

    // Check minSpend
    if (promotion.minSpend && subTotal < promotion.minSpend) {
      throw new AppError(
        400,
        `Đơn hàng tối thiểu ${promotion.minSpend.toLocaleString()}đ để áp dụng mã này`,
        "MIN_SPEND_NOT_MET"
      );
    }

    // Tính discount
    let discountAmount = 0;
    if (promotion.discountType === "percentage") {
      discountAmount = (subTotal * promotion.discountValue) / 100;
    } else if (promotion.discountType === "fixed") {
      discountAmount = promotion.discountValue;
    }

    if (discountAmount > subTotal) {
      discountAmount = subTotal;
    }

    discount = {
      code: promotion.code,
      amount: discountAmount,
    };
  }
  // Tính phí ship
  const shippingFee = subTotal > 5000000 ? 0 : 30000; // Nếu đơn hàng > 5 triệu thì miễn phí ship

  // Tính totalAmount
  const totalAmount = subTotal + shippingFee - discount.amount;

  // Generate order code
  const code = generateOrderCode();

  // Tạo order
  const order = await Order.create({
    user: userId,
    code,
    items: orderItems,
    shippingAddress: {
      fullName: shippingAddress.fullName,
      phone: shippingAddress.phone,
      province: shippingAddress.province,
      district: shippingAddress.district,
      ward: shippingAddress.ward,
      address: shippingAddress.address,
    },
    payment: {
      method: paymentMethod,
      status: paymentMethod === "BANK" ? "completed" : "pending",
      transactionId: paymentMethod === "BANK" ? transactionId : undefined,
    },
    subTotal,
    shippingFee,
    discount,
    totalAmount,
    status: "pending",
    notes: notes || "",
  });

  // Giảm stock và tăng soldCount
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: {
        stock: -item.quantity,
        soldCount: item.quantity,
      },
    });
  }

  // Xóa giỏ hàng
  cart.items = [];
  cart.subTotal = 0;
  cart.discount = { code: null, amount: 0 };
  cart.totalAmount = 0;
  await cart.save();

  // Populate để trả về
  const populatedOrder = await Order.findById(order._id)
    .populate("user", "fullName email phone")
    .populate("items.product", "name slug images");

  res.status(201).json({
    success: true,
    message: "Đặt hàng thành công",
    order: populatedOrder,
  });
});

// [GET] /api/orders - Lấy đơn hàng của người dùng hiện tại
exports.getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: userId };

  // Filter by status
  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate("items.product", "name slug images")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    message: "Lấy danh sách đơn hàng thành công",
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// [GET] /api/orders/:id - Lấy chi tiết đơn hàng theo ID
exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Chỉ user sở hữu hoặc admin
  if (
    order.user._id.toString() !== userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new AppError(403, "Bạn không có quyền xem đơn hàng này", "FORBIDDEN");
  }
  const order = await Order.findById(id)
    .populate("user", "fullName email phone")
    .populate("items.product", "name slug images");

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại", "ORDER_NOT_FOUND");
  }
  res.json({
    success: true,
    message: "Lấy thông tin đơn hàng thành công",
    order,
  });
});

// [PUT] /api/orders/:id/cancel - Hủy đơn hàng
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại", "ORDER_NOT_FOUND");
  }

  // Check quyền
  if (
    order.user.toString() !== userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new AppError(403, "Bạn không có quyền hủy đơn hàng này", "FORBIDDEN");
  }

  // Chỉ cho phép hủy khi status = pending hoặc processing
  if (!["pending", "processing"].includes(order.status)) {
    throw new AppError(
      400,
      "Không thể hủy đơn hàng đã được giao hoặc đã hủy",
      "CANNOT_CANCEL"
    );
  }

  // Hoàn lại stock và giảm soldCount
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: item.quantity,
        soldCount: -item.quantity,
      },
    });
  }

  // Update order status
  order.status = "cancelled";
  await order.save();

  res.json({
    success: true,
    message: "Hủy đơn hàng thành công",
    order,
  });
});

// [GET] /api/orders/code/:code - Lấy đơn hàng theo mã đơn hàng (public tracking)
exports.getOrderByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const order = await Order.findOne({ code })
    .populate("items.product", "name slug images")
    .select("-user"); // Không hiển thị user info cho public

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại", "ORDER_NOT_FOUND");
  }

  res.json({
    success: true,
    message: "Tra cứu đơn hàng thành công",
    order,
  });
});

// ========== ADMIN ORDER ROUTES ==========

// [GET] /api/admin/orders - Lấy tất cả đơn hàng
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    status,
    paymentStatus,
    paymentMethod,
    search,
    page = 1,
    limit = 20,
    sortBy = "-createdAt",
  } = req.query;

  const query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by payment status
  if (paymentStatus) {
    query["payment.status"] = paymentStatus;
  }

  // Filter by payment method
  if (paymentMethod) {
    query["payment.method"] = paymentMethod;
  }

  // Search by code, user info
  if (search) {
    query.$or = [
      { code: { $regex: search, $options: "i" } },
      { "shippingAddress.fullName": { $regex: search, $options: "i" } },
      { "shippingAddress.phone": { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate("user", "fullName email phone")
    .populate("items.product", "name slug")
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  // Calculate stats - chỉ tính đơn hàng đã giao
  const totalRevenue = await Order.aggregate([
    { $match: { status: "delivered" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  res.json({
    success: true,
    message: "Lấy danh sách đơn hàng thành công",
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
    stats: {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders: total,
    },
  });
});

// [GET] /api/admin/orders/:id - Lấy chi tiết đơn hàng theo ID (admin)
exports.getOrderByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate("user", "fullName email phone avatar")
    .populate("items.product", "name slug images price");

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại", "ORDER_NOT_FOUND");
  }

  res.json({
    success: true,
    message: "Lấy thông tin đơn hàng thành công",
    order,
  });
});

// [PUT] /api/admin/orders/:id/status - Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!status || !validStatuses.includes(status)) {
    throw new AppError(400, "Trạng thái không hợp lệ", "INVALID_STATUS");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại", "ORDER_NOT_FOUND");
  }

  // Không cho cập nhật nếu đã cancelled
  if (order.status === "cancelled") {
    throw new AppError(
      400,
      "Không thể cập nhật đơn hàng đã hủy",
      "ORDER_CANCELLED"
    );
  }
  // Không cho cập nhật nếu đã delivered
  if (order.status === "delivered") {
    throw new AppError(
      400,
      "Không thể cập nhật đơn hàng đã giao",
      "ORDER_DELIVERED"
    );
  }
  // Auto update payment status khi delivered (COD)
  if (status === "delivered" && order.payment.method === "COD") {
    order.payment.status = "completed";
  }

  order.status = status;
  await order.save();

  res.json({
    success: true,
    message: "Cập nhật trạng thái đơn hàng thành công",
    order,
  });
});

// [PUT] /api/admin/orders/:id/payment-status - Cập nhật trạng thái thanh toán đơn hàng
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  const validStatuses = ["pending", "completed", "failed"];

  if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
    throw new AppError(
      400,
      "Trạng thái thanh toán không hợp lệ",
      "INVALID_PAYMENT_STATUS"
    );
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại", "ORDER_NOT_FOUND");
  }
  if (order.status === "cancelled") {
    throw new AppError(
      400,
      "Không thể cập nhật trạng thái thanh toán cho đơn hàng đã hủy",
      "ORDER_CANCELLED"
    );
  }
  order.payment.status = paymentStatus;
  await order.save();

  res.json({
    success: true,
    message: "Cập nhật trạng thái thanh toán thành công",
    order,
  });
});

// [DELETE] /api/admin/orders/:id - Xóa đơn hàng
exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError(404, "Đơn hàng không tồn tại", "ORDER_NOT_FOUND");
  }

  await Order.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Xóa đơn hàng thành công",
  });
});

// [GET] /api/admin/orders/stats - Thống kê đơn hàng
exports.getOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchQuery = {};

  // Filter by date range
  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  // Revenue by status
  const revenueByStatus = await Order.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        total: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  // Order count by status
  const orderCountByStatus = await Order.aggregate([
    { $match: matchQuery },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // Total revenue (chỉ đơn hàng đã giao)
  const totalRevenue = await Order.aggregate([
    { $match: { ...matchQuery, status: "delivered" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  // Best selling products (chỉ đơn hàng đã giao)
  const bestSellingProducts = await Order.aggregate([
    { $match: { ...matchQuery, status: "delivered" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 1,
        name: "$product.name",
        slug: "$product.slug",
        image: { $arrayElemAt: ["$product.images", 0] },
        totalSold: 1,
        revenue: 1,
      },
    },
  ]);

  res.json({
    success: true,
    message: "Lấy thống kê đơn hàng thành công",
    stats: {
      totalRevenue: totalRevenue[0]?.total || 0,
      revenueByStatus,
      orderCountByStatus,
      bestSellingProducts,
    },
  });
});

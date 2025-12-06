const asyncHandler = require("express-async-handler");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Promotion = require("../models/Promotion");
const AppError = require("../utils/AppError");

// Helper function: Tính toán tổng giỏ hàng
const calculateCartTotals = (cart) => {
  // Tính subTotal
  cart.subTotal = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // Tính totalAmount (subTotal - discount)
  cart.totalAmount = cart.subTotal - (cart.discount?.amount || 0);

  // Đảm bảo totalAmount không âm
  if (cart.totalAmount < 0) {
    cart.totalAmount = 0;
  }

  return cart;
};

// ========== CART ROUTES ==========

// [GET] /api/cart - Lấy giỏ hàng của người dùng
exports.getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug images price salePrice stock",
  });

  // Nếu chưa có cart, tạo mới
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      subTotal: 0,
      totalAmount: 0,
    });
  }

  // Validate stock cho từng item
  const validItems = [];
  let hasOutOfStock = false;

  for (const item of cart.items) {
    if (!item.product) {
      hasOutOfStock = true;
      continue; // Product đã bị xóa
    }

    // Check stock
    if (item.product.stock < item.quantity) {
      hasOutOfStock = true;
      // Tự động điều chỉnh quantity về stock hiện có
      if (item.product.stock > 0) {
        item.quantity = item.product.stock;
        validItems.push(item);
      }
      // Nếu stock = 0, bỏ qua item này
    } else {
      // Cập nhật price nếu thay đổi
      const currentPrice = item.product.salePrice || item.product.price;
      if (item.price !== currentPrice) {
        item.price = currentPrice;
      }
      validItems.push(item);
    }
  }

  // Cập nhật cart nếu có thay đổi
  if (hasOutOfStock || validItems.length !== cart.items.length) {
    cart.items = validItems;
    calculateCartTotals(cart);
    await cart.save();
  }

  res.json({
    success: true,
    message: hasOutOfStock
      ? "Giỏ hàng đã được cập nhật do một số sản phẩm hết hàng"
      : "Lấy giỏ hàng thành công",
    cart,
  });
});

// [POST] /api/cart/items - Thêm sản phẩm vào giỏ hàng
exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw new AppError(400, "Product ID là bắt buộc", "MISSING_PRODUCT_ID");
  }

  if (quantity < 1) {
    throw new AppError(
      400,
      "Số lượng phải lớn hơn hoặc bằng 1",
      "INVALID_QUANTITY"
    );
  }

  // Check product tồn tại
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  // Check stock
  if (product.stock < quantity) {
    throw new AppError(
      400,
      `Sản phẩm chỉ còn ${product.stock} trong kho`,
      "INSUFFICIENT_STOCK"
    );
  }

  // Tìm hoặc tạo cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      subTotal: 0,
      totalAmount: 0,
    });
  }

  // Check xem product đã có trong cart chưa
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  const price = product.salePrice || product.price;

  if (existingItemIndex > -1) {
    // Sản phẩm đã có, tăng quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;

    if (product.stock < newQuantity) {
      throw new AppError(
        400,
        `Sản phẩm chỉ còn ${product.stock} trong kho`,
        "INSUFFICIENT_STOCK"
      );
    }

    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = price; // Cập nhật giá mới nhất
  } else {
    // Thêm sản phẩm mới
    cart.items.push({
      product: productId,
      quantity,
      price,
    });
  }

  // Tính lại tổng
  calculateCartTotals(cart);
  await cart.save();

  // Populate để trả về
  await cart.populate({
    path: "items.product",
    select: "name slug images price salePrice stock",
  });

  res.json({
    success: true,
    message: "Thêm sản phẩm vào giỏ hàng thành công",
    cart,
  });
});

// [PUT] /api/cart/items/:productId - Cập nhật số lượng sản phẩm trong giỏ hàng
exports.updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError(
      400,
      "Số lượng phải lớn hơn hoặc bằng 1",
      "INVALID_QUANTITY"
    );
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, "Giỏ hàng không tồn tại", "CART_NOT_FOUND");
  }

  // Tìm item trong cart
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new AppError(
      404,
      "Sản phẩm không có trong giỏ hàng",
      "ITEM_NOT_FOUND"
    );
  }

  // Check product stock
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  if (product.stock < quantity) {
    throw new AppError(
      400,
      `Sản phẩm chỉ còn ${product.stock} trong kho`,
      "INSUFFICIENT_STOCK"
    );
  }

  // Update quantity và price
  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].price = product.salePrice || product.price;

  // Tính lại tổng
  calculateCartTotals(cart);
  await cart.save();

  // Populate để trả về
  await cart.populate({
    path: "items.product",
    select: "name slug images price salePrice stock",
  });

  res.json({
    success: true,
    message: "Cập nhật giỏ hàng thành công",
    cart,
  });
});

// [DELETE] /api/cart/items/:productId - Xóa sản phẩm khỏi giỏ hàng
exports.removeCartItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, "Giỏ hàng không tồn tại", "CART_NOT_FOUND");
  }

  // Tìm và xóa item
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new AppError(
      404,
      "Sản phẩm không có trong giỏ hàng",
      "ITEM_NOT_FOUND"
    );
  }

  cart.items.splice(itemIndex, 1);

  // Tính lại tổng
  calculateCartTotals(cart);
  await cart.save();

  // Populate để trả về
  await cart.populate({
    path: "items.product",
    select: "name slug images price salePrice stock",
  });

  res.json({
    success: true,
    message: "Xóa sản phẩm khỏi giỏ hàng thành công",
    cart,
  });
});

// [DELETE] /api/cart - Xóa toàn bộ giỏ hàng
exports.clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, "Giỏ hàng không tồn tại", "CART_NOT_FOUND");
  }

  cart.items = [];
  cart.subTotal = 0;
  cart.discount = { code: null, amount: 0 };
  cart.totalAmount = 0;

  await cart.save();

  res.json({
    success: true,
    message: "Xóa toàn bộ giỏ hàng thành công",
    cart,
  });
});

// [POST] /api/cart/discount - Áp dụng mã giảm giá cho giỏ hàng
exports.applyDiscount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { code } = req.body;

  if (!code) {
    throw new AppError(400, "Mã giảm giá là bắt buộc", "MISSING_CODE");
  }

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, "Giỏ hàng không tồn tại", "CART_NOT_FOUND");
  }

  if (cart.items.length === 0) {
    throw new AppError(400, "Giỏ hàng trống", "CART_EMPTY");
  }

  // Tìm promotion
  const promotion = await Promotion.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!promotion) {
    throw new AppError(
      404,
      "Mã giảm giá không tồn tại hoặc đã hết hạn",
      "INVALID_CODE"
    );
  }

  // Check ngày hết hạn
  const now = new Date();
  if (promotion.startDate && now < promotion.startDate) {
    throw new AppError(400, "Mã giảm giá chưa có hiệu lực", "CODE_NOT_STARTED");
  }

  if (promotion.endDate && now > promotion.endDate) {
    throw new AppError(400, "Mã giảm giá đã hết hạn", "CODE_EXPIRED");
  }

  // Check minSpend (đổi từ minOrderValue)
  if (promotion.minSpend && cart.subTotal < promotion.minSpend) {
    throw new AppError(
      400,
      `Đơn hàng tối thiểu ${promotion.minSpend.toLocaleString()}đ để áp dụng mã này`,
      "MIN_ORDER_NOT_MET"
    );
  }

  // Tính discount amount
  let discountAmount = 0;

  if (promotion.discountType === "percentage") {
    discountAmount = (cart.subTotal * promotion.discountValue) / 100;
  } else if (promotion.discountType === "fixed") {
    discountAmount = promotion.discountValue;
  }

  // Đảm bảo discount không lớn hơn subTotal
  if (discountAmount > cart.subTotal) {
    discountAmount = cart.subTotal;
  }

  // Cập nhật cart
  cart.discount = {
    code: promotion.code,
    amount: discountAmount,
  };

  calculateCartTotals(cart);
  await cart.save();

  // Populate để trả về
  await cart.populate({
    path: "items.product",
    select: "name slug images price salePrice stock",
  });

  res.json({
    success: true,
    message: "Áp dụng mã giảm giá thành công",
    cart,
    discount: {
      code: promotion.code,
      amount: discountAmount,
      type: promotion.discountType,
      value: promotion.discountValue,
    },
  });
});

// [DELETE] /api/cart/discount - Gỡ mã giảm giá khỏi giỏ hàng
exports.removeDiscount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, "Giỏ hàng không tồn tại", "CART_NOT_FOUND");
  }

  cart.discount = { code: null, amount: 0 };

  calculateCartTotals(cart);
  await cart.save();

  // Populate để trả về
  await cart.populate({
    path: "items.product",
    select: "name slug images price salePrice stock",
  });

  res.json({
    success: true,
    message: "Gỡ mã giảm giá thành công",
    cart,
  });
});

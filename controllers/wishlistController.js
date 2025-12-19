const asyncHandler = require("express-async-handler");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

// ========== USER WISHLIST ROUTES ==========

// [GET] /api/wishlist - Lấy danh sách yêu thích của người dùng
exports.getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "products",
    select: "name slug images price salePrice stock averageRating totalReviews",
    populate: [
      {
        path: "category",
        select: "name slug",
      },
      {
        path: "brand",
        select: "name slug",
      },
    ],
  });

  // Nếu chưa có wishlist, tạo mới
  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [],
    });
  }

  res.json({
    success: true,
    message: "Lấy danh sách yêu thích thành công",
    wishlist,
    count: wishlist.products.length,
  });
});

// [POST] /api/wishlist/:productId - Thêm sản phẩm vào yêu thích
exports.addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  // Check product tồn tại
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  // Tìm hoặc tạo wishlist
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [],
    });
  }

  // Check sản phẩm đã có trong wishlist chưa
  const isExist = wishlist.products.some((p) => p.toString() === productId);

  if (isExist) {
    throw new AppError(
      400,
      "Sản phẩm đã có trong danh sách yêu thích",
      "ALREADY_IN_WISHLIST"
    );
  }

  // Thêm sản phẩm
  wishlist.products.push(productId);
  await wishlist.save();

  // Populate để trả về
  await wishlist.populate({
    path: "products",
    select: "name slug images price salePrice stock averageRating totalReviews",
  });

  res.json({
    success: true,
    message: "Thêm sản phẩm vào danh sách yêu thích thành công",
    wishlist,
    count: wishlist.products.length,
  });
});

// [DELETE] /api/wishlist/:productId - Xóa sản phẩm khỏi yêu thích
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    throw new AppError(
      404,
      "Danh sách yêu thích không tồn tại",
      "WISHLIST_NOT_FOUND"
    );
  }

  // Check sản phẩm có trong wishlist không
  const productIndex = wishlist.products.findIndex(
    (p) => p.toString() === productId
  );

  if (productIndex === -1) {
    throw new AppError(
      404,
      "Sản phẩm không có trong danh sách yêu thích",
      "PRODUCT_NOT_IN_WISHLIST"
    );
  }

  // Xóa sản phẩm
  wishlist.products.splice(productIndex, 1);
  await wishlist.save();

  // Populate để trả về
  await wishlist.populate({
    path: "products",
    select: "name slug images price salePrice stock averageRating totalReviews",
  });

  res.json({
    success: true,
    message: "Xóa sản phẩm khỏi danh sách yêu thích thành công",
    wishlist,
    count: wishlist.products.length,
  });
});

// [DELETE] /api/wishlist - Xóa toàn bộ danh sách yêu thích
exports.clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    throw new AppError(
      404,
      "Danh sách yêu thích không tồn tại",
      "WISHLIST_NOT_FOUND"
    );
  }

  wishlist.products = [];
  await wishlist.save();

  res.json({
    success: true,
    message: "Xóa toàn bộ danh sách yêu thích thành công",
    wishlist,
    count: 0,
  });
});

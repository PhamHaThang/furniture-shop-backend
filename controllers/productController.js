const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");

// ========== PUBLIC ROUTES ==========
// [GET] /api/products?category=id&brand=id&minPrice=&maxPrice=&search=&page=&limit=&sort=&deleted=
// [GET] /api/admin/products
exports.getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    search,
    sort,
    page = 1,
    limit = 10,
    deleted = "active", // active | all | deleted
  } = req.query;

  const filter = {};

  // Handle deleted filter
  if (deleted === "active") {
    filter.isDeleted = false;
  } else if (deleted === "deleted") {
    filter.isDeleted = true;
  }
  // If deleted === "all", don't add isDeleted filter

  if (category) {
    const subcategories = await Category.find({
      parentCategory: category,
    }).select("_id");
    if (subcategories.length > 0) {
      const categoryIds = [category, ...subcategories.map((sub) => sub._id)];
      filter.category = { $in: categoryIds };
    } else {
      filter.category = category;
    }
  }

  if (brand) filter.brand = brand;

  const priceMin = minPrice;
  const priceMax = maxPrice;
  if (priceMin || priceMax) {
    filter.price = {};
    if (priceMin) filter.price.$gte = Number(priceMin);
    if (priceMax) filter.price.$lte = Number(priceMax);
  }
  const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (search) {
    const keyword = escapeRegex(search);
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
      { sku: { $regex: keyword, $options: "i" } },
      { slug: { $regex: keyword, $options: "i" } },
      { tags: { $elemMatch: { $regex: keyword, $options: "i" } } },
      { colors: { $elemMatch: { $regex: keyword, $options: "i" } } },
      { materials: { $elemMatch: { $regex: keyword, $options: "i" } } },
    ];
  }

  // Sorting
  let sortOption = { createdAt: -1 }; // newest
  if (sort) {
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "price-asc":
        sortOption = { price: 1 };
        break;
      case "price-desc":
        sortOption = { price: -1 };
        break;
      case "name-asc":
        sortOption = { name: 1 };
        break;
      case "name-desc":
        sortOption = { name: -1 };
        break;
      case "best-seller":
        sortOption = { soldCount: -1 };
        break;
      case "rating":
        sortOption = { averageRating: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const products = await Product.find(filter)
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .skip(skip)
    .limit(Number(limit))
    .sort(sortOption);

  const total = await Product.countDocuments(filter);
  res.json({
    success: true,
    message: "Lấy danh sách sản phẩm thành công",
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});
// [GET] /api/products/:slug
exports.getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug, isDeleted: false })
    .populate("category", "name slug")
    .populate("brand", "name slug");
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }
  res.json({
    success: true,
    message: "Lấy thông tin sản phẩm thành công",
    product,
  });
});

// [GET] /api/products/featured - Lấy sản phẩm nổi bật
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({ isFeatured: true, isDeleted: false })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .sort({ averageRating: -1, totalReviews: -1, createdAt: -1 })
    .limit(Number(limit));

  res.json({
    success: true,
    message: "Lấy sản phẩm nổi bật thành công",
    products,
  });
});

// [GET] /api/products/new-arrivals - Lấy sản phẩm mới
exports.getNewArrivals = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({ isDeleted: false })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json({
    success: true,
    message: "Lấy sản phẩm mới thành công",
    products,
  });
});

// [GET] /api/products/best-sellers - Lấy sản phẩm bán chạy
exports.getBestSellers = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({ isDeleted: false })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .sort({ soldCount: -1 })
    .limit(Number(limit));

  res.json({
    success: true,
    message: "Lấy sản phẩm bán chạy thành công",
    products,
  });
});

// [GET] /api/products/related/:productId - Lấy sản phẩm liên quan
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { limit = 4 } = req.query;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  const relatedProducts = await Product.find({
    _id: { $ne: productId },
    isDeleted: false,
    $or: [
      { category: product.category },
      { brand: product.brand },
      { tags: { $in: product.tags } },
    ],
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .limit(Number(limit))
    .sort({ averageRating: -1 });

  res.json({
    success: true,
    message: "Lấy sản phẩm liên quan thành công",
    products: relatedProducts,
  });
});

// ========== ADMIN ROUTES ==========
// [GET] /api/admin/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate("brand", "name slug");
  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }
  res.json({
    success: true,
    message: "Lấy thông tin sản phẩm thành công",
    product,
  });
});
// [POST] /api/admin/products
exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    description,
    price,
    originalPrice,
    category,
    brand,
    stock,
    images,
    model3DUrl,
    dimensions,
    colors,
    materials,
    tags,
    isFeatured,
  } = req.body;

  // Validate required fields
  if (!name || !sku || !description || !price || !category || !brand) {
    throw new AppError(
      400,
      "Vui lòng cung cấp đầy đủ thông tin sản phẩm",
      "MISSING_REQUIRED_FIELDS"
    );
  }

  // Check SKU exists
  const existingSKU = await Product.findOne({ sku });
  if (existingSKU) {
    throw new AppError(400, "SKU đã tồn tại", "SKU_EXISTS");
  }

  const product = await Product.create({
    name,
    sku,
    description,
    price,
    originalPrice,
    category,
    brand,
    stock: stock || 0,
    images: images || [],
    model3DUrl,
    dimensions,
    colors: colors || [],
    materials: materials || [],
    tags: tags || [],
    isFeatured: isFeatured || false,
  });

  const populatedProduct = await Product.findById(product._id)
    .populate("category", "name slug")
    .populate("brand", "name slug");

  res.status(201).json({
    success: true,
    message: "Tạo sản phẩm thành công",
    product: populatedProduct,
  });
});

// [PUT] /api/admin/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    sku,
    description,
    price,
    originalPrice,
    category,
    brand,
    stock,
    images,
    model3DUrl,
    dimensions,
    colors,
    materials,
    tags,
    isFeatured,
    isDeleted,
  } = req.body;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  // Check SKU if changed
  if (sku && sku !== product.sku) {
    const existingSKU = await Product.findOne({ sku });
    if (existingSKU) {
      throw new AppError(400, "SKU đã tồn tại", "SKU_EXISTS");
    }
  }

  // Update fields
  product.name = name || product.name;
  product.sku = sku || product.sku;
  product.description = description || product.description;
  product.price = price !== undefined ? price : product.price;
  product.originalPrice =
    originalPrice !== undefined ? originalPrice : product.originalPrice;
  product.category = category || product.category;
  product.brand = brand || product.brand;
  product.stock = stock !== undefined ? stock : product.stock;
  product.images = images || product.images;
  product.model3DUrl = model3DUrl || product.model3DUrl;
  product.dimensions = dimensions || product.dimensions;
  product.colors = colors || product.colors;
  product.materials = materials || product.materials;
  product.tags = tags || product.tags;
  product.isFeatured =
    isFeatured !== undefined ? isFeatured : product.isFeatured;
  product.isDeleted = isDeleted !== undefined ? isDeleted : product.isDeleted;

  const updatedProduct = await product.save();

  const populatedProduct = await Product.findById(updatedProduct._id)
    .populate("category", "name slug")
    .populate("brand", "name slug");

  res.json({
    success: true,
    message: "Cập nhật sản phẩm thành công",
    product: populatedProduct,
  });
});

// [DELETE] /api/admin/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    throw new AppError(404, "Sản phẩm không tồn tại", "PRODUCT_NOT_FOUND");
  }

  // Kiểm tra sản phẩm có trong đơn hàng đang xử lý không
  const activeOrders = await Order.countDocuments({
    "items.product": id,
    status: { $in: ["pending", "processing", "shipped"] },
  });

  if (activeOrders > 0) {
    throw new AppError(
      400,
      `Không thể xóa sản phẩm vì đang có ${activeOrders} đơn hàng đang xử lý`,
      "PRODUCT_IN_ACTIVE_ORDERS"
    );
  }

  // Soft delete - chuyển isDeleted thành true
  product.isDeleted = true;
  await product.save();

  res.json({
    success: true,
    message: "Xóa sản phẩm thành công",
  });
});

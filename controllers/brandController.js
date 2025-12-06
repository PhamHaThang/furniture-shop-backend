const asyncHandler = require("express-async-handler");
const Brand = require("../models/Brand");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

// ========== PUBLIC ROUTES ==========

// [GET] /api/brands - Lấy tất cả thương hiệu
exports.getAllBrands = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;

  let query = {};

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  // Pagination
  if (page && limit) {
    const skip = (Number(page) - 1) * Number(limit);
    const brands = await Brand.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Brand.countDocuments(query);

    return res.json({
      success: true,
      message: "Lấy danh sách thương hiệu thành công",
      brands,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  }
  // No pagination
  const brands = await Brand.find(query).sort({ name: 1 });

  res.json({
    success: true,
    message: "Lấy danh sách thương hiệu thành công",
    brands,
  });
});

// [GET] /api/brands/:slug - Lấy thương hiệu theo slug
exports.getBrandBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const brand = await Brand.findOne({ slug });

  if (!brand) {
    throw new AppError(404, "Thương hiệu không tồn tại", "BRAND_NOT_FOUND");
  }

  // Đếm số sản phẩm
  const productCount = await Product.countDocuments({ brand: brand._id });

  res.json({
    success: true,
    message: "Lấy thông tin thương hiệu thành công",
    brand: {
      ...brand.toObject(),
      productCount,
    },
  });
});

// [GET] /api/brands/popular - Lấy thương hiệu phổ biến
exports.getPopularBrands = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const brands = await Brand.find({}).sort({ name: 1 });

  // Count products for each brand and sort
  const brandsWithCount = await Promise.all(
    brands.map(async (brand) => {
      const productCount = await Product.countDocuments({
        brand: brand._id,
      });

      return {
        _id: brand._id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        image: brand.image,
        productCount,
      };
    })
  );

  // Sort by product count descending and limit
  const popularBrands = brandsWithCount
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, Number(limit));

  res.json({
    success: true,
    message: "Lấy danh sách thương hiệu phổ biến thành công",
    brands: popularBrands,
  });
});

// ========== ADMIN ROUTES ==========

// [GET] /api/admin/brands - Lấy danh sách thương hiệu cho admin
exports.getAllBrandsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;

  let query = {};

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  // Pagination
  const currentPage = Number(page) || 1;
  const currentLimit = Number(limit) || 20;
  const skip = (currentPage - 1) * currentLimit;

  const brands = await Brand.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentLimit);

  // Count products cho mỗi brand
  const brandsWithCount = await Promise.all(
    brands.map(async (brand) => {
      const productCount = await Product.countDocuments({
        brand: brand._id,
      });

      return {
        ...brand.toObject(),
        productCount,
      };
    })
  );

  const total = await Brand.countDocuments(query);

  res.json({
    success: true,
    message: "Lấy danh sách thương hiệu thành công",
    brands: brandsWithCount,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  });
});

// [POST] /api/admin/brands - Tạo thương hiệu mới
exports.createBrand = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  if (!name) {
    throw new AppError(400, "Tên thương hiệu là bắt buộc", "MISSING_NAME");
  }

  // Check tên đã tồn tại
  const existingBrand = await Brand.findOne({ name });
  if (existingBrand) {
    throw new AppError(400, "Tên thương hiệu đã tồn tại", "BRAND_EXISTS");
  }

  const brand = await Brand.create({
    name,
    description,
    image,
  });

  res.status(201).json({
    success: true,
    message: "Tạo thương hiệu thành công",
    brand,
  });
});

// [PUT] /api/admin/brands/:id - Cập nhật thương hiệu
exports.updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image } = req.body;

  const brand = await Brand.findById(id);

  if (!brand) {
    throw new AppError(404, "Thương hiệu không tồn tại", "BRAND_NOT_FOUND");
  }

  // Check tên trùng (nếu đổi tên)
  if (name && name !== brand.name) {
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      throw new AppError(400, "Tên thương hiệu đã tồn tại", "BRAND_EXISTS");
    }
  }

  // Update fields
  brand.name = name || brand.name;
  brand.description =
    description !== undefined ? description : brand.description;
  brand.image = image !== undefined ? image : brand.image;

  const updatedBrand = await brand.save();

  res.json({
    success: true,
    message: "Cập nhật thương hiệu thành công",
    brand: updatedBrand,
  });
});

// [DELETE] /api/admin/brands/:id - Xóa thương hiệu
exports.deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const brand = await Brand.findById(id);

  if (!brand) {
    throw new AppError(404, "Thương hiệu không tồn tại", "BRAND_NOT_FOUND");
  }

  // Check products
  const products = await Product.countDocuments({ brand: id });
  if (products > 0) {
    throw new AppError(
      400,
      "Không thể xóa thương hiệu có sản phẩm",
      "HAS_PRODUCTS"
    );
  }

  await Brand.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Xóa thương hiệu thành công",
  });
});

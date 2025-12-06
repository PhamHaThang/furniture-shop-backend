const asyncHandler = require("express-async-handler");

const Category = require("../models/Category");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

// ========== PUBLIC ROUTES ==========

// [GET] /api/categories - Lấy tất cả danh mục
exports.getAllCategories = asyncHandler(async (req, res) => {
  const { page, limit, parent } = req.query;

  let query = {};

  // Lọc theo parent
  if (parent === "null" || parent === "none") {
    query.parentCategory = null;
  } else if (parent) {
    query.parentCategory = parent;
  }

  if (page && limit) {
    const skip = (Number(page) - 1) * Number(limit);
    const categories = await Category.find(query)
      .populate("parentCategory", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Category.countDocuments(query);

    return res.json({
      success: true,
      message: "Lấy danh sách danh mục thành công",
      categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  }

  const categories = await Category.find(query)
    .populate("parentCategory", "name slug")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    message: "Lấy danh sách danh mục thành công",
    categories,
  });
});

// [GET] /api/categories/:slug - Lấy danh mục theo slug
exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug }).populate(
    "parentCategory",
    "name slug"
  );

  if (!category) {
    throw new AppError(404, "Danh mục không tồn tại", "CATEGORY_NOT_FOUND");
  }

  // Lấy subcategories
  const subcategories = await Category.find({
    parentCategory: category._id,
  }).sort({ name: 1 });

  // Đếm số sản phẩm
  const productCount = await Product.countDocuments({ category: category._id });

  res.json({
    success: true,
    message: "Lấy thông tin danh mục thành công",
    category: {
      ...category.toObject(),
      subcategories,
      productCount,
    },
  });
});

// [GET] /api/categories/tree - Lấy cấu trúc cây danh mục
exports.getCategoryTree = asyncHandler(async (req, res) => {
  // Lấy tất cả categories
  const categories = await Category.find({}).sort({ name: 1 });

  // Build tree structure
  const categoryMap = {};
  const tree = [];

  // Tạo map
  categories.forEach((cat) => {
    categoryMap[cat._id] = {
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      parentCategory: cat.parentCategory,
      children: [],
    };
  });

  // Build tree
  categories.forEach((cat) => {
    if (cat.parentCategory) {
      const parent = categoryMap[cat.parentCategory];
      if (parent) {
        parent.children.push(categoryMap[cat._id]);
      }
    } else {
      tree.push(categoryMap[cat._id]);
    }
  });

  res.json({
    success: true,
    message: "Lấy cấu trúc danh mục thành công",
    tree,
  });
});

// ========== ADMIN ROUTES ==========

// [GET] /api/admin/categories - Lấy danh sách danh mục cho admin
exports.getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const { page, limit, search, parent } = req.query;

  let query = {};

  // Search by name
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  // Filter by parent
  if (parent === "null" || parent === "none") {
    query.parentCategory = null;
  } else if (parent) {
    query.parentCategory = parent;
  }

  // Pagination
  const currentPage = Number(page) || 1;
  const currentLimit = Number(limit) || 20;
  const skip = (currentPage - 1) * currentLimit;

  const categories = await Category.find(query)
    .populate("parentCategory", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentLimit);

  // Count products cho mỗi category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const productCount = await Product.countDocuments({
        category: category._id,
      });
      const subcategoryCount = await Category.countDocuments({
        parentCategory: category._id,
      });

      return {
        ...category.toObject(),
        productCount,
        subcategoryCount,
      };
    })
  );

  const total = await Category.countDocuments(query);

  res.json({
    success: true,
    message: "Lấy danh sách danh mục thành công",
    categories: categoriesWithCount,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  });
});

// [POST] /api/admin/categories - Tạo danh mục mới
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, parentCategory } = req.body;

  if (!name) {
    throw new AppError(400, "Tên danh mục là bắt buộc", "MISSING_NAME");
  }

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new AppError(400, "Tên danh mục đã tồn tại", "CATEGORY_EXISTS");
  }

  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      throw new AppError(
        404,
        "Danh mục cha không tồn tại",
        "PARENT_CATEGORY_NOT_FOUND"
      );
    }
  }

  const category = await Category.create({
    name,
    description,
    image: image || null,
    parentCategory: parentCategory || null,
  });

  const populatedCategory = await Category.findById(category._id).populate(
    "parentCategory",
    "name slug"
  );

  res.status(201).json({
    success: true,
    message: "Tạo danh mục thành công",
    category: populatedCategory,
  });
});

// [PUT] /api/admin/categories/:id - Cập nhật danh mục
exports.updateCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image, parentCategory } = req.body;

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError(404, "Danh mục không tồn tại", "CATEGORY_NOT_FOUND");
  }

  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      throw new AppError(400, "Tên danh mục đã tồn tại", "CATEGORY_EXISTS");
    }
  }

  // Validate parentCategory
  if (parentCategory !== undefined) {
    // Nếu parentCategory là chuỗi rỗng hoặc null, set thành null (root category)
    if (parentCategory === "" || parentCategory === null) {
      category.parentCategory = null;
    } else {
      // Không cho phép set parent là chính nó
      if (parentCategory === id) {
        throw new AppError(
          400,
          "Không thể set danh mục cha là chính nó",
          "INVALID_PARENT"
        );
      }

      // Check parent tồn tại
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        throw new AppError(
          404,
          "Danh mục cha không tồn tại",
          "PARENT_CATEGORY_NOT_FOUND"
        );
      }

      // Prevent circular reference: nếu parent hiện tại có parentCategory = category này
      if (parent.parentCategory && parent.parentCategory.toString() === id) {
        throw new AppError(
          400,
          "Không thể tạo vòng lặp danh mục",
          "CIRCULAR_REFERENCE"
        );
      }

      category.parentCategory = parentCategory;
    }
  }

  // Update fields
  category.name = name || category.name;
  category.description =
    description !== undefined ? description : category.description;
  category.image = image !== undefined ? image : category.image;

  const updatedCategory = await category.save();

  const populatedCategory = await Category.findById(
    updatedCategory._id
  ).populate("parentCategory", "name slug");

  res.json({
    success: true,
    message: "Cập nhật danh mục thành công",
    category: populatedCategory,
  });
});

// [DELETE] /api/admin/categories/:id - Xóa danh mục
exports.deleteCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    throw new AppError(404, "Danh mục không tồn tại", "CATEGORY_NOT_FOUND");
  }

  // Check subcategories
  const subcategories = await Category.countDocuments({ parentCategory: id });
  if (subcategories > 0) {
    throw new AppError(
      400,
      "Không thể xóa danh mục có danh mục con",
      "HAS_SUBCATEGORIES"
    );
  }

  // Check products
  const products = await Product.countDocuments({ category: id });
  if (products > 0) {
    throw new AppError(
      400,
      "Không thể xóa danh mục có sản phẩm",
      "HAS_PRODUCTS"
    );
  }

  await Category.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Xóa danh mục thành công",
  });
});

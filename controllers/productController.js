const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");
const {
    escapeRegex,
    buildRegexSearchFilter,
    normalizeModel3DUrl,
} = require("../utils/helpter");

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
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const filter = {};
    let categoryIds = [];

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
            categoryIds = [category, ...subcategories.map((sub) => sub._id)];
            filter.category = { $in: categoryIds };
        } else {
            filter.category = category;
            categoryIds = [category];
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
    const trimmedSearch = search ? search.trim() : "";

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
    if (trimmedSearch) {
        const keyword = escapeRegex(trimmedSearch);
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
    const skip = (pageNum - 1) * limitNum;
    const products = await Product.find(filter)
        .populate("category", "name slug")
        .populate("brand", "name slug")
        .skip(skip)
        .limit(limitNum)
        .sort(sortOption);

    const total = await Product.countDocuments(filter);
    res.json({
        success: true,
        message: "Lấy danh sách sản phẩm thành công",
        products,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
    });
});
// [GET] /api/products/search?q=keyword&page=&limit=&sort=
exports.searchProducts = asyncHandler(async (req, res) => {
    const {
        q = "",
        page = 1,
        limit = 10,
        sort = "relevance", // relevance | newest | price-asc | price-desc
        category,
        brand,
        minPrice,
        maxPrice,
    } = req.query;

    const keyword = q.trim();
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    if (!keyword) {
        return res.json({
            success: true,
            message: "Từ khóa tìm kiếm rỗng",
            products: [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: 0,
                totalPages: 0,
            },
        });
    }

    let categoryIds = [];
    if (category) {
        const subcategories = await Category.find({
            parentCategory: category,
        }).select("_id");

        if (subcategories.length > 0) {
            categoryIds = [category, ...subcategories.map((sub) => sub._id)];
        } else {
            categoryIds = [category];
        }
    }

    const fallbackBaseFilter = {
        isDeleted: false,
    };

    if (categoryIds.length > 0) {
        fallbackBaseFilter.category = { $in: categoryIds };
    }

    if (brand) {
        fallbackBaseFilter.brand = brand;
    }

    if (minPrice || maxPrice) {
        fallbackBaseFilter.price = {};
        if (minPrice) fallbackBaseFilter.price.$gte = Number(minPrice);
        if (maxPrice) fallbackBaseFilter.price.$lte = Number(maxPrice);
    }

    const textFilter = {
        ...fallbackBaseFilter,
        $text: { $search: keyword },
    };

    let sortOption;
    switch (sort) {
        case "newest":
            sortOption = { createdAt: -1 };
            break;
        case "price-asc":
            sortOption = { price: 1 };
            break;
        case "price-desc":
            sortOption = { price: -1 };
            break;
        case "relevance":
        default:
            sortOption = {
                score: { $meta: "textScore" },
                soldCount: -1,
                averageRating: -1,
                createdAt: -1,
            };
            break;
    }

    const [textProducts, textTotal] = await Promise.all([
        Product.find(textFilter)
            .populate("category", "name slug")
            .populate("brand", "name slug")
            .sort(sortOption)
            .skip(skip)
            .limit(limitNum),
        Product.countDocuments(textFilter),
    ]);

    if (textTotal === 0) {
        const regexFilter = {
            ...fallbackBaseFilter,
            ...buildRegexSearchFilter(keyword),
        };

        const [products, total] = await Promise.all([
            Product.find(regexFilter)
                .populate("category", "name slug")
                .populate("brand", "name slug")
                .sort({ soldCount: -1, averageRating: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Product.countDocuments(regexFilter),
        ]);

        return res.json({
            success: true,
            message: "Tìm kiếm sản phẩm thành công",
            products,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: total > 0 ? Math.ceil(total / limitNum) : 0,
            },
        });
    }

    res.json({
        success: true,
        message: "Tìm kiếm sản phẩm thành công",
        products: textProducts,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: textTotal,
            totalPages: Math.ceil(textTotal / limitNum),
        },
    });
});
// [GET] /api/products/suggestions?q=keyword&limit=
exports.getSearchSuggestions = asyncHandler(async (req, res) => {
    const { q = "", limit = 8 } = req.query;
    const keyword = q.trim();
    const limitNum = Math.min(20, Math.max(1, Number(limit) || 8));

    if (keyword.length < 2) {
        return res.json({
            success: true,
            message: "Từ khóa quá ngắn",
            suggestions: [],
        });
    }

    const escaped = escapeRegex(keyword);
    const startsWithRegex = new RegExp(`^${escaped}`, "i");
    const containsRegex = new RegExp(escaped, "i");

    const prefixMatches = await Product.find({
        isDeleted: false,
        $or: [
            { name: startsWithRegex },
            { slug: startsWithRegex },
            { sku: startsWithRegex },
            { tags: startsWithRegex },
        ],
    })
        .select("name slug price images")
        .sort({ soldCount: -1, averageRating: -1 })
        .limit(limitNum);

    let suggestions = prefixMatches;

    if (prefixMatches.length < limitNum) {
        const usedIds = prefixMatches.map((item) => item._id);
        const remain = limitNum - prefixMatches.length;

        const containsMatches = await Product.find({
            _id: { $nin: usedIds },
            isDeleted: false,
            $or: [
                { name: containsRegex },
                { slug: containsRegex },
                { sku: containsRegex },
                { tags: containsRegex },
            ],
        })
            .select("name slug price images")
            .sort({ soldCount: -1, averageRating: -1 })
            .limit(remain);

        suggestions = [...prefixMatches, ...containsMatches];
    }

    res.json({
        success: true,
        message: "Lấy gợi ý tìm kiếm thành công",
        suggestions,
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
            "MISSING_REQUIRED_FIELDS",
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
        model3DUrl: normalizeModel3DUrl(model3DUrl),
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

    const normalizedModel3DUrl = normalizeModel3DUrl(model3DUrl);

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
    if (normalizedModel3DUrl !== undefined) {
        product.model3DUrl = normalizedModel3DUrl;
    }
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
            "PRODUCT_IN_ACTIVE_ORDERS",
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

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Homi Shop API",
      version: "1.0.0",
      description:
        "REST API cho hệ thống bán hàng nội thất trực tuyến Homi Shop",
      contact: {
        name: "PhamHaThang",
        email: "hathang2004@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token từ login hoặc register",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            email: { type: "string", example: "user@example.com" },
            fullName: { type: "string", example: "John Doe" },
            phone: { type: "string", example: "0123456789" },
            avatar: { type: "string", example: "https://cloudinary.com/..." },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            isDeleted: {
              type: "boolean",
              example: false,
              description: "Tr\u1ea1ng th\u00e1i x\u00f3a m\u1ec1m",
            },
            address: {
              type: "array",
              items: { $ref: "#/components/schemas/Address" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Address: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Home" },
            phone: { type: "string", example: "0123456789" },
            street: { type: "string", example: "123 Main St" },
            city: { type: "string", example: "Ho Chi Minh" },
            country: { type: "string", example: "Vietnam" },
            isDefault: { type: "boolean", example: false },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Modern Sofa" },
            slug: { type: "string", example: "modern-sofa" },
            sku: { type: "string", example: "SOFA-001" },
            description: { type: "string" },
            price: { type: "number", example: 5000000 },
            originalPrice: { type: "number", example: 6000000 },
            isFeatured: { type: "boolean", example: false },
            isDeleted: {
              type: "boolean",
              example: false,
              description: "Tr\u1ea1ng th\u00e1i x\u00f3a m\u1ec1m",
            },
            images: {
              type: "array",
              items: { type: "string" },
              example: ["https://cloudinary.com/image1.jpg"],
            },
            model3DUrl: {
              type: "string",
              example: "https://cloudinary.com/model.glb",
            },
            category: { $ref: "#/components/schemas/Category" },
            brand: { $ref: "#/components/schemas/Brand" },
            stock: { type: "number", example: 10 },
            averageRating: { type: "number", example: 4.5 },
            totalReviews: { type: "number", example: 20 },
            soldCount: { type: "number", example: 50 },
            colors: {
              type: "array",
              items: { type: "string" },
              example: ["Red", "Blue"],
            },
            materials: {
              type: "array",
              items: { type: "string" },
              example: ["Fabric"],
            },
            dimensions: {
              type: "object",
              properties: {
                width: { type: "number", example: 200 },
                height: { type: "number", example: 80 },
                length: { type: "number", example: 90 },
              },
            },
            weight: { type: "number", example: 50 },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["modern", "luxury"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Sofa" },
            slug: { type: "string", example: "sofa" },
            description: { type: "string" },
            parentCategory: { type: "string", nullable: true },
          },
        },
        Brand: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "IKEA" },
            slug: { type: "string", example: "ikea" },
            image: { type: "string" },
            description: { type: "string" },
          },
        },
        Cart: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { $ref: "#/components/schemas/Product" },
                  quantity: { type: "number", example: 2 },
                  price: { type: "number", example: 5000000 },
                },
              },
            },
            subTotal: { type: "number", example: 10000000 },
            discount: {
              type: "object",
              properties: {
                code: { type: "string", example: "SAVE10" },
                amount: { type: "number", example: 1000000 },
              },
            },
            totalAmount: { type: "number", example: 9000000 },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string", example: "FS123456ABC" },
            user: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  name: { type: "string" },
                  image: { type: "string" },
                  quantity: { type: "number" },
                  price: { type: "number" },
                },
              },
            },
            shippingAddress: { $ref: "#/components/schemas/Address" },
            payment: {
              type: "object",
              properties: {
                method: {
                  type: "string",
                  enum: ["COD", "BANK"],
                  example: "COD",
                },
                status: {
                  type: "string",
                  enum: ["pending", "completed", "failed"],
                  example: "pending",
                },
                transactionId: { type: "string" },
              },
            },
            status: {
              type: "string",
              enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ],
            },
            subTotal: { type: "number" },
            shippingFee: { type: "number" },
            discount: {
              type: "object",
              properties: {
                code: { type: "string" },
                amount: { type: "number" },
              },
            },
            totalAmount: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            product: { type: "string" },
            rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
            comment: { type: "string", example: "Excellent product!" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Promotion: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string", example: "SAVE10" },
            description: { type: "string", example: "Save 10%" },
            discountType: {
              type: "string",
              enum: ["percentage", "fixed"],
              example: "percentage",
            },
            discountValue: { type: "number", example: 10 },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            minSpend: { type: "number", example: 1000000 },
            isActive: { type: "boolean", example: true },
          },
        },
        Wishlist: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            products: {
              type: "array",
              items: { $ref: "#/components/schemas/Product" },
            },
          },
        },

        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            error: { type: "string", example: "ERROR_CODE" },
            stack: { type: "string", nullable: true },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total: { type: "number", example: 100 },
            page: { type: "number", example: 1 },
            limit: { type: "number", example: 12 },
            totalPages: { type: "number", example: 9 },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                message: "Truy cập bị từ chối, không có token",
                error: "UNAUTHORIZED",
              },
            },
          },
        },
        ForbiddenError: {
          description: "User does not have permission",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                message: "Bạn không có quyền truy cập tài nguyên này",
                error: "FORBIDDEN",
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: {
                success: false,
                message: "Không tìm thấy tài nguyên",
                error: "NOT_FOUND",
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "Xác thực và quản lý tài khoản" },
      { name: "Users", description: "Quản lý người dùng" },
      { name: "Products", description: "Quản lý sản phẩm" },
      { name: "Categories", description: "Quản lý danh mục" },
      { name: "Brands", description: "Quản lý thương hiệu" },
      { name: "Cart", description: "Giỏ hàng" },
      { name: "Orders", description: "Đơn hàng" },
      { name: "Reviews", description: "Đánh giá sản phẩm" },
      { name: "Wishlist", description: "Danh sách yêu thích" },
      { name: "Promotions", description: "Khuyến mãi" },
      { name: "Upload", description: "Upload files" },

      { name: "Admin", description: "Quản trị hệ thống" },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js", "./server.js", "./docs/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

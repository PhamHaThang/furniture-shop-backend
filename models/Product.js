const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên sản phẩm là bắt buộc"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    sku: {
      type: String,
      unique: true,
      required: [true, "SKU là bắt buộc"],
    }, // Stock Keeping Unit,
    description: {
      type: String,
      required: [true, "Mô tả sản phẩm là bắt buộc"],
    },
    price: {
      type: Number,
      required: [true, "Giá sản phẩm là bắt buộc"],
      min: [0, "Giá sản phẩm không được âm"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Danh mục sản phẩm là bắt buộc"],
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      index: true,
    },
    stock: {
      type: Number,
      required: [true, "Số lượng trong kho là bắt buộc"],
      min: [0, "Số lượng trong kho không được âm"],
      default: 0,
    },
    images: [
      {
        type: String,
      },
    ],
    model3DUrl: {
      type: String,
    },
    dimensions: {
      width: Number,
      height: Number,
      length: Number,
    },
    colors: [String],
    materials: [String],
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);
// Tạo slug tự động trước khi lưu
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});
module.exports = mongoose.model("Product", productSchema);

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Đánh giá là bắt buộc"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Nội dung đánh giá là bắt buộc"],
    },
  },
  {
    timestamps: true,
  }
);
// Đảm bảo mỗi user chỉ review 1 lần cho 1 sản phẩm
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);

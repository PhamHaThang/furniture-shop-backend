const mongoose = require("mongoose");
const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề banner là bắt buộc"],
      trim: true,
    },
    subtitle: {
      type: String,
    },
    image: {
      type: String,
      required: [true, "Hình ảnh banner là bắt buộc"],
    },
    link: {
      type: String,
      require: [true, "Liên kết banner là bắt buộc"],
      default: "#",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    position: {
      type: String,
      enum: ["main-carousel", "sidebar", "promo"],
      default: "main-carousel",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Banner", bannerSchema);

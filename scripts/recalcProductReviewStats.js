require("dotenv").config();

const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const products = await Product.find({ isDeleted: false }).select("_id").lean();
  const productIds = products.map((p) => p._id);

  const agg = await Review.aggregate([
    { $match: { product: { $in: productIds } } },
    {
      $group: {
        _id: "$product",
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  const statsMap = new Map(agg.map((item) => [String(item._id), item]));

  const ops = products.map((product) => {
    const stats = statsMap.get(String(product._id));
    return {
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            totalReviews: Number(stats?.totalReviews || 0),
            averageRating: Number((stats?.averageRating || 0).toFixed(3)),
          },
        },
      },
    };
  });

  if (ops.length) {
    await Product.bulkWrite(ops);
  }

  const reviewCount = await Review.countDocuments({});
  console.log(
    JSON.stringify(
      {
        productsUpdated: ops.length,
        reviewCount,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Recalc failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});

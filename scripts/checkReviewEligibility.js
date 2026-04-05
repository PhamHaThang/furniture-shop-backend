require("dotenv").config();

const mongoose = require("mongoose");
const Review = require("../models/Review");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const violations = await Review.aggregate([
    {
      $lookup: {
        from: "orders",
        let: { uid: "$user", pid: "$product" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", "$$uid"] },
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: "$items",
                            as: "it",
                            cond: { $eq: ["$$it.product", "$$pid"] },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  { $eq: ["$status", "delivered"] },
                  { $eq: ["$payment.status", "completed"] },
                ],
              },
            },
          },
        ],
        as: "eligibleOrders",
      },
    },
    { $match: { eligibleOrders: { $size: 0 } } },
    { $count: "invalidReviewCount" },
  ]);

  console.log(JSON.stringify(violations[0] || { invalidReviewCount: 0 }, null, 2));

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Check failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});

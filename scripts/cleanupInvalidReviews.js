require("dotenv").config();

const mongoose = require("mongoose");
const Review = require("../models/Review");

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    apply: args.includes("--apply"),
  };
};

const getInvalidReviewIds = async () => {
  const rows = await Review.aggregate([
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
    { $project: { _id: 1 } },
  ]);

  return rows.map((row) => row._id);
};

const run = async () => {
  const { apply } = parseArgs();
  await mongoose.connect(process.env.MONGO_URI);

  const invalidIds = await getInvalidReviewIds();
  const invalidCount = invalidIds.length;

  if (!apply) {
    console.log(JSON.stringify({ mode: "dry-run", invalidReviewCount: invalidCount }, null, 2));
    await mongoose.disconnect();
    return;
  }

  if (!invalidCount) {
    console.log(JSON.stringify({ mode: "apply", deletedCount: 0 }, null, 2));
    await mongoose.disconnect();
    return;
  }

  const result = await Review.deleteMany({ _id: { $in: invalidIds } });
  console.log(
    JSON.stringify(
      {
        mode: "apply",
        invalidReviewCount: invalidCount,
        deletedCount: result.deletedCount || 0,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Cleanup failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});

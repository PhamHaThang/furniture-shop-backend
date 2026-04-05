require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { connect } = require("../configs/database");
const { generateOrderCode } = require("../utils/generateOrderCode");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");

const RANDOM_COMMENTS = {
  good: [
    "San pham rat tot, chat luong cao, giao nhanh.",
    "Rat hai long, dep hon mong doi.",
    "Dung rat on, se quay lai mua tiep.",
    "Good quality, worth the money.",
    "Dong goi can than, khong co loi.",
  ],
  bad: [
    "Chat luong tam on, chua nhu ky vong.",
    "San pham dung duoc nhung giao hoi cham.",
    "Khong hai long lam ve mau sac.",
    "Not good as expected, can improve.",
    "Co mot vai diem chua on, tam chap nhan.",
  ],
};

const SHIPPING_TEMPLATES = [
  {
    province: "Ha Noi",
    district: "Ha Dong",
    ward: "Mo Lao",
    address: "Km10 Nguyen Trai",
  },
  {
    province: "TP Ho Chi Minh",
    district: "Quan 1",
    ward: "Ben Nghe",
    address: "123 Le Loi",
  },
  {
    province: "Da Nang",
    district: "Hai Chau",
    ward: "Thach Thang",
    address: "58 Tran Phu",
  },
];

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_METHODS = ["COD", "BANK"];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];

const pickUniqueProducts = (products, count) => {
  const used = new Set();
  const picked = [];
  while (picked.length < count && used.size < products.length) {
    const idx = randomInt(0, products.length - 1);
    if (used.has(idx)) continue;
    used.add(idx);
    picked.push(products[idx]);
  }
  return picked;
};

const randomDateWithinDays = (daysBack = 120) => {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(randomInt(past, now));
};

const ensureSeedUsers = async (minimumUsers = 12) => {
  const existingUsers = await User.find({ role: "user", isDeleted: false })
    .select("_id fullName email phone")
    .lean();

  if (existingUsers.length >= minimumUsers) return existingUsers;

  const usersToCreate = minimumUsers - existingUsers.length;
  const newUsers = [];

  for (let i = 1; i <= usersToCreate; i += 1) {
    const suffix = `${Date.now()}${i}`;
    const fullName = `ML Seed User ${i}`;
    const email = `ml.seed.${suffix}@example.com`;
    const phone = `09${randomInt(10000000, 99999999)}`;
    const password = await bcrypt.hash("123456", 10);

    newUsers.push({
      fullName,
      email,
      phone,
      password,
      role: "user",
      isDeleted: false,
    });
  }

  const inserted = await User.insertMany(newUsers, { ordered: false });
  const merged = existingUsers.concat(
    inserted.map((u) => ({ _id: u._id, fullName: u.fullName, email: u.email, phone: u.phone }))
  );
  return merged;
};

const buildOrderItem = (product) => {
  const quantity = randomInt(1, 3);
  const price = Number(product.price || 0);

  return {
    product: product._id,
    name: product.name,
    quantity,
    price,
    image: Array.isArray(product.images) && product.images.length ? product.images[0] : "",
  };
};

const createOrdersForUsers = async (users, products, options) => {
  const { minOrdersPerUser, maxOrdersPerUser, dayWindow } = options;
  const orders = [];

  for (const user of users) {
    const orderCount = randomInt(minOrdersPerUser, maxOrdersPerUser);

    for (let i = 0; i < orderCount; i += 1) {
      const itemCount = randomInt(1, Math.min(4, products.length));
      const selectedProducts = pickUniqueProducts(products, itemCount);
      const items = selectedProducts.map((p) => buildOrderItem(p));

      const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shippingFee = subTotal >= 5000000 ? 0 : 30000;
      const discountAmount = randomInt(0, 1) ? 0 : randomInt(10000, 100000);
      const totalAmount = Math.max(0, subTotal + shippingFee - discountAmount);
      const status = randomChoice(ORDER_STATUSES);
      const paymentMethod = randomChoice(PAYMENT_METHODS);
      const paymentStatus = status === "cancelled" ? "failed" : randomChoice(["pending", "completed"]);
      const createdAt = randomDateWithinDays(dayWindow);
      const shippingTemplate = randomChoice(SHIPPING_TEMPLATES);

      orders.push({
        user: user._id,
        code: generateOrderCode(),
        items,
        shippingAddress: {
          fullName: user.fullName,
          phone: user.phone || `09${randomInt(10000000, 99999999)}`,
          province: shippingTemplate.province,
          district: shippingTemplate.district,
          ward: shippingTemplate.ward,
          address: shippingTemplate.address,
        },
        payment: {
          method: paymentMethod,
          status: paymentStatus,
          transactionId: paymentMethod === "BANK" ? `TX${Date.now()}${randomInt(100, 999)}` : undefined,
        },
        status,
        subTotal,
        shippingFee,
        discount: {
          code: discountAmount > 0 ? "SEED" : undefined,
          amount: discountAmount,
        },
        totalAmount,
        notes: "Du lieu don hang seed cho ML analytics",
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  if (!orders.length) return [];
  return Order.insertMany(orders, { ordered: false });
};

const createReviewsFromOrders = async (orders, options) => {
  const { maxReviewsPerUserProduct, dayWindow } = options;
  if (!orders.length) return [];

  const existing = await Review.find({})
    .select("user product")
    .lean();

  const existingPairs = new Set(existing.map((r) => `${String(r.user)}:${String(r.product)}`));
  const reviewMapCounter = new Map();
  const reviewsToInsert = [];
  const eligibleOrders = orders.filter(
    (order) => order.status === "delivered" && order.payment?.status === "completed"
  );

  for (const order of eligibleOrders) {

    for (const item of order.items || []) {
      const pairKey = `${String(order.user)}:${String(item.product)}`;
      const counter = reviewMapCounter.get(pairKey) || 0;
      if (existingPairs.has(pairKey) || counter >= maxReviewsPerUserProduct) continue;
      if (Math.random() > 0.7) continue;

      const rating = randomInt(2, 5);
      const commentPool = rating >= 4 ? RANDOM_COMMENTS.good : RANDOM_COMMENTS.bad;
      const comment = randomChoice(commentPool);
      const createdAt = randomDateWithinDays(dayWindow);

      reviewsToInsert.push({
        user: order.user,
        product: item.product,
        rating,
        comment,
        createdAt,
        updatedAt: createdAt,
      });

      reviewMapCounter.set(pairKey, counter + 1);
      existingPairs.add(pairKey);
    }
  }

  if (!reviewsToInsert.length) return [];
  return Review.insertMany(reviewsToInsert, { ordered: false });
};

const recalcProductStats = async () => {
  const products = await Product.find({ isDeleted: false }).select("_id").lean();
  const productIds = products.map((p) => p._id);

  const [reviewAgg, soldAgg] = await Promise.all([
    Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: "$product",
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          soldCount: { $sum: "$items.quantity" },
        },
      },
    ]),
  ]);

  const reviewMap = new Map(reviewAgg.map((r) => [String(r._id), r]));
  const soldMap = new Map(soldAgg.map((s) => [String(s._id), s]));

  const operations = products.map((p) => {
    const reviewStat = reviewMap.get(String(p._id));
    const soldStat = soldMap.get(String(p._id));

    return {
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            totalReviews: Number(reviewStat?.totalReviews || 0),
            averageRating: Number((reviewStat?.averageRating || 0).toFixed(3)),
            soldCount: Number(soldStat?.soldCount || 0),
          },
        },
      },
    };
  });

  if (operations.length) {
    await Product.bulkWrite(operations);
  }
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    minOrdersPerUser: 2,
    maxOrdersPerUser: 6,
    minUsers: 12,
    dayWindow: 120,
    maxReviewsPerUserProduct: 1,
  };

  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (!key || value === undefined) continue;

    if (key === "--minOrders") parsed.minOrdersPerUser = Number(value) || parsed.minOrdersPerUser;
    if (key === "--maxOrders") parsed.maxOrdersPerUser = Number(value) || parsed.maxOrdersPerUser;
    if (key === "--minUsers") parsed.minUsers = Number(value) || parsed.minUsers;
    if (key === "--days") parsed.dayWindow = Number(value) || parsed.dayWindow;
  }

  if (parsed.maxOrdersPerUser < parsed.minOrdersPerUser) {
    parsed.maxOrdersPerUser = parsed.minOrdersPerUser;
  }

  return parsed;
};

const run = async () => {
  const options = parseArgs();

  await connect();

  const products = await Product.find({ isDeleted: false })
    .select("_id name price images")
    .lean();

  if (!products.length) {
    throw new Error("Khong co product nao trong DB. Hay tao product truoc khi seed.");
  }

  const users = await ensureSeedUsers(options.minUsers);
  const orders = await createOrdersForUsers(users, products, options);
  const reviews = await createReviewsFromOrders(orders, options);

  await recalcProductStats();

  console.log("=== Seed ML data completed ===");
  console.log(`Users available: ${users.length}`);
  console.log(`Orders inserted: ${orders.length}`);
  console.log(`Reviews inserted: ${reviews.length}`);
};

if (require.main === module) {
  run()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Seed ML data failed:", error.message);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = {
  run,
};

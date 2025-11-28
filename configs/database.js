const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

module.exports.connect = async () => {
  try {
    await mongoose.connect(MONGO_URI, {});
    console.log(">>>Connect Database Success");
  } catch (error) {
    console.error(">>>Connect Database Error:", error);
    process.exit(1);
  }
};

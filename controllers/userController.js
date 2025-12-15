const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const AppError = require("../utils/AppError");

// ========== USER PROFILE ROUTES ==========
// [GET] /api/users/me
exports.getProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    message: "Lấy thông tin người dùng thành công",
    user,
  });
});
// [PUT] /api/users/me
exports.updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  user.fullName = fullName || user.fullName;
  user.phone = phone || user.phone;
  user.avatar = avatar || user.avatar;

  const updatedUser = await user.save();
  res.json({
    success: true,
    message: "Cập nhật thông tin người dùng thành công",
    user: {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
    },
  });
});

// [POST] /api/users/me/avatar - Upload avatar
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, "Vui lòng chọn ảnh để upload", "NO_FILE");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }

  // Cập nhật avatar
  user.avatar = req.file.path;
  await user.save();

  res.json({
    success: true,
    message: "Upload avatar thành công",
    avatar: {
      url: req.file.path,
      publicId: req.file.filename,
    },
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
    },
  });
});

// [PUT] /api/users/me/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  if (!currentPassword || !newPassword) {
    throw new AppError(
      400,
      "Vui lòng cung cấp đầy đủ thông tin",
      "MISSING_FIELDS"
    );
  }
  if (currentPassword === newPassword) {
    throw new AppError(
      400,
      "Mật khẩu mới phải khác mật khẩu hiện tại",
      "SAME_PASSWORD"
    );
  }
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new AppError(401, "Mật khẩu hiện tại không đúng", "INVALID_PASSWORD");
  }
  if (newPassword.length < 6) {
    throw new AppError(
      400,
      "Mật khẩu mới phải có ít nhất 6 ký tự",
      "WEAK_PASSWORD"
    );
  }
  user.password = newPassword;
  await user.save();
  res.json({
    success: true,
    message: "Đổi mật khẩu thành công",
  });
});
// [GET] /api/users/me/address
exports.getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    message: "Lấy danh sách địa chỉ thành công",
    addresses: user.address || [],
  });
});
// [POST] /api/users/me/address
exports.addAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, province, district, ward, address, isDefault } =
    req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  if (isDefault) {
    user.address.forEach((addr) => (addr.isDefault = false));
  }
  user.address.push({
    fullName,
    phone,
    province,
    district,
    ward,
    address,
    isDefault,
  });
  await user.save();
  res.status(201).json({
    success: true,
    message: "Thêm địa chỉ thành công",
    addresses: user.address,
  });
});
// [PUT] /api/users/me/address/:id
exports.updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, province, district, ward, address, isDefault } =
    req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  const addr = user.address.id(id);
  if (!addr) {
    throw new AppError(404, "Địa chỉ không tồn tại", "ADDRESS_NOT_FOUND");
  }
  if (isDefault) {
    user.address.forEach((a) => (a.isDefault = false));
  }
  addr.fullName = fullName || addr.fullName;
  addr.phone = phone || addr.phone;
  addr.province = province || addr.province;
  addr.district = district || addr.district;
  addr.ward = ward || addr.ward;
  addr.address = address || addr.address;
  addr.isDefault = isDefault !== undefined ? isDefault : addr.isDefault;
  await user.save();
  res.json({
    success: true,
    message: "Cập nhật địa chỉ thành công",
    addresses: user.address,
  });
});
// [DELETE] /api/users/me/address/:id
exports.deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  const address = user.address.id(id);
  if (!address) {
    throw new AppError(404, "Địa chỉ không tồn tại", "ADDRESS_NOT_FOUND");
  }
  await address.deleteOne();
  await user.save();
  res.json({
    success: true,
    message: "Xoá địa chỉ thành công",
    addresses: user.address,
  });
});

// ========== ADMIN ROUTES ==========
// [GET] /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    sortBy = "-createdAt",
    deleted = "active",
  } = req.query;

  const filter = {};

  // Handle deleted filter
  if (deleted === "active") {
    filter.isDeleted = false;
  } else if (deleted === "deleted") {
    filter.isDeleted = true;
  }
  // If deleted === "all", don't add isDeleted filter

  // Search by name or email
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by role
  if (role && (role === "user" || role === "admin")) {
    filter.role = role;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const users = await User.find(filter)
    .select("-password")
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    message: "Lấy danh sách người dùng thành công",
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});
// [GET] /api/admin/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select("-password");
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  res.json({
    success: true,
    message: "Lấy thông tin người dùng thành công",
    user,
  });
});
// [POST] /api/admin/users
exports.createUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, phone, avatar, address } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, "Email đã được sử dụng", "USER_EXISTS");
  }
  let normalizedAddress = [];

  if (Array.isArray(address) && address.length > 0) {
    normalizedAddress = address.filter((a) => a && Object.keys(a).length > 0);
  }
  const newUser = new User({
    fullName,
    email,
    password,
    role: role || "user",
    phone,
    avatar,
    address: normalizedAddress,
  });
  const savedUser = await newUser.save();
  res.status(201).json({
    success: true,
    message: "Tạo người dùng thành công",
    user: {
      _id: savedUser._id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      phone: savedUser.phone,
      avatar: savedUser.avatar,
      role: savedUser.role,
      address: savedUser.address,
    },
  });
});
// [PUT] /api/admin/users/:id
exports.updateUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, role, avatar, address, password, isDeleted } =
    req.body;
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  user.fullName = fullName || user.fullName;
  user.phone = phone || user.phone;
  user.role = role || user.role;
  user.avatar = avatar || user.avatar;
  user.address = address || user.address;
  user.isDeleted = isDeleted !== undefined ? isDeleted : user.isDeleted;
  if (password) {
    if (password.length < 6) {
      throw new AppError(
        400,
        "Mật khẩu phải có ít nhất 6 ký tự",
        "WEAK_PASSWORD"
      );
    }
    user.password = password;
  }
  const updatedUser = await user.save();
  res.json({
    success: true,
    message: "Cập nhật người dùng thành công",
    user: {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      address: updatedUser.address,
    },
  });
});
// [DELETE] /api/admin/users/:id
exports.deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, "Người dùng không tồn tại", "USER_NOT_FOUND");
  }
  // Soft delete
  user.isDeleted = true;
  await user.save();
  res.json({
    success: true,
    message: "Xoá người dùng thành công",
  });
});

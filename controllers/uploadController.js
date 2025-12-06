const asyncHandler = require("express-async-handler");
const cloudinary = require("../configs/cloudinary");
const AppError = require("../utils/AppError");

// ========== UPLOAD CONTROLLERS ==========

// [POST] /api/upload/image - Upload single image
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, "Vui lòng chọn file để upload", "NO_FILE");
  }

  res.json({
    success: true,
    message: "Upload ảnh thành công",
    data: {
      url: req.file.path,
      publicId: req.file.filename,
      format: req.file.format,
      width: req.file.width,
      height: req.file.height,
      size: req.file.size,
    },
  });
});

// [POST] /api/upload/images - Upload multiple images
exports.uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError(400, "Vui lòng chọn file để upload", "NO_FILES");
  }

  const images = req.files.map((file) => ({
    url: file.path,
    publicId: file.filename,
    format: file.format,
    width: file.width,
    height: file.height,
    size: file.size,
  }));

  res.json({
    success: true,
    message: `Upload ${req.files.length} ảnh thành công`,
    data: images,
    count: images.length,
  });
});

// [POST] /api/upload/3d-model - Upload 3D model file
exports.upload3DModel = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, "Vui lòng chọn file 3D để upload", "NO_FILE");
  }

  res.json({
    success: true,
    message: "Upload 3D model thành công",
    data: {
      url: req.file.path,
      publicId: req.file.filename,
      format: req.file.format,
      resourceType: req.file.resource_type,
      size: req.file.size,
    },
  });
});

// [DELETE] /api/upload/delete - Delete file from Cloudinary
exports.deleteFile = asyncHandler(async (req, res) => {
  const { publicId, resourceType = "image" } = req.body;

  if (!publicId) {
    throw new AppError(400, "Vui lòng cung cấp publicId", "NO_PUBLIC_ID");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== "ok") {
      throw new AppError(400, "Xóa file thất bại", "DELETE_FAILED");
    }

    res.json({
      success: true,
      message: "Xóa file thành công",
      data: result,
    });
  } catch (error) {
    throw new AppError(
      500,
      "Lỗi khi xóa file từ Cloudinary",
      "CLOUDINARY_ERROR"
    );
  }
});

// [DELETE] /api/upload/delete-multiple - Delete multiple files
exports.deleteMultipleFiles = asyncHandler(async (req, res) => {
  const { publicIds, resourceType = "image" } = req.body;

  if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
    throw new AppError(
      400,
      "Vui lòng cung cấp danh sách publicIds",
      "NO_PUBLIC_IDS"
    );
  }

  try {
    const results = await Promise.all(
      publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
      )
    );

    const successCount = results.filter((r) => r.result === "ok").length;

    res.json({
      success: true,
      message: `Xóa ${successCount}/${publicIds.length} file thành công`,
      data: {
        total: publicIds.length,
        success: successCount,
        failed: publicIds.length - successCount,
        details: results,
      },
    });
  } catch (error) {
    throw new AppError(
      500,
      "Lỗi khi xóa files từ Cloudinary",
      "CLOUDINARY_ERROR"
    );
  }
});

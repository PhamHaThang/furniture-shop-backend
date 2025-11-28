const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../configs/cloudinary");

// Storage cho hình ảnh
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "furniture-shop/images",
    allowedFormats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

// Storage cho model 3D
const modelStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "furniture-shop/models",
    allowedFormats: ["gltf", "glb", "obj", "fbx"],
    resource_type: "raw",
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        "Chỉ cho phép tải lên tệp ảnh (jpg, jpeg, png, webp)"
      );
      error.code = "INVALID_FILE_TYPE";
      cb(error, false);
    }
  },
});
const uploadModel = multer({
  storage: modelStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "model/gltf-binary",
      "model/gltf+json",
      "application/octet-stream", // for .obj and .fbx
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        "Chỉ cho phép tải lên tệp model 3D (gltf, glb, obj, fbx)"
      );
      error.code = "INVALID_FILE_TYPE";
      cb(error, false);
    }
  },
});

module.exports = {
  uploadImage,
  uploadModel,
};

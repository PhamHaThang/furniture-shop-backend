const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, requireRole } = require("../middlewares/authMiddleware");

// User Profile Routes
router
  .route("/me")
  .get(protect, userController.getProfile)
  .put(protect, userController.updateProfile);

router.put("/me/password", protect, userController.changePassword);

router
  .route("/me/address")
  .get(protect, userController.getAddresses)
  .post(protect, userController.addAddress);

router
  .route("/me/address/:id")
  .put(protect, userController.updateAddress)
  .delete(protect, userController.deleteAddress);

// Admin User Management Routes
router
  .route("/")
  .get(protect, requireRole("admin"), userController.getAllUsers)
  .post(protect, requireRole("admin"), userController.createUser);

router
  .route("/:id")
  .get(protect, requireRole("admin"), userController.getUserById)
  .put(protect, requireRole("admin"), userController.updateUserById)
  .delete(protect, requireRole("admin"), userController.deleteUserById);
module.exports = router;

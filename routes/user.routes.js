const express = require("express");
const router = express.Router();

const upload = require("../config/multer.config");
const { protect, admin } = require("../middleware/auth.middleware");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUser,
  verifyOTP,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  refreshToken,
} = require("../controllers/user.controller");

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyOTP", protect, verifyOTP);
router.post("/resetPassword", protect, resetPassword);
router.get("/getUser", protect, getUser);
router.put("/updateProfile", protect, upload.single("avatar"), updateUserProfile);
router.post("/refreshToken", refreshToken);

// Admin routes
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);

module.exports = router;
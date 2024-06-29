// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../config/multerConfig");
const { protect } = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUser,
  verifyOTP,
  updateUserProfile
} = require("../controllers/userController");

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyOTP", protect, verifyOTP);
router.post("/resetPassword", protect, resetPassword);
router.get("/getUser", protect, getUser);
router.put("/updateProfile", protect, upload.single("avatar"), updateUserProfile);

module.exports = router;

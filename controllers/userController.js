const asyncHandler = require("express-async-handler");
const userService = require("../services/userService");

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const user = await userService.registerUser(fullName, email, password);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userService.loginUser(email, password);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Send password reset OTP to user's email
// @route   POST /api/auth/forgotPassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email;

  try {
    const user = await userService.forgotPassword(email);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Verify OTP sent to user's email
// @route   POST /api/auth/verifyOTP
// @access  Private
const verifyOTP = async (req, res) => {
  const otp = req.body.otp;
  const userId = req.user._id;

  try {
    const result = await userService.verifyOTP(userId, otp);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Reset user password
// @route   POST /api/auth/resetPassword
// @access  Private
const resetPassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const password = req.body.password;

  try {
    const result = await userService.resetPassword(userId, password);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Get user information
// @route   POST /api/auth/getUser
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await userService.getUser(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/updateProfile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const avatar = req.file.filename;
  const { fullName, email, phoneNumber, currentPassword, newPassword } = req.body;

  try {
    const user = await userService.updateUserProfile(userId, avatar, fullName, email, phoneNumber, currentPassword, newPassword);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = {
  registerUser,
  loginUser,
  resetPassword,
  forgotPassword,
  verifyOTP,
  getUser,
  updateUserProfile
};

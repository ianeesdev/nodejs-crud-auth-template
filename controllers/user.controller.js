const asyncHandler = require("express-async-handler");
const userService = require("../services/user.service");
const ResponseModel = require("../utils/response.model");

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  try {
    const user = await userService.registerUser(fullName, email, password, role);
    const response = new ResponseModel(true, "User registered successfully", user);
    res.status(201).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await userService.loginUser(email, password);
    const response = new ResponseModel(true, "User logged in successfully", user);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Refresh Token
// @route   POST /api/auth/refreshToken
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    const token = await userService.refreshToken(refreshToken);
    const response = new ResponseModel(true, "Token refreshed successfully", token);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Send password reset OTP to user's email
// @route   POST /api/auth/forgotPassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const email = req.body.email;

  try {
    const user = await userService.forgotPassword(email);
    const response = new ResponseModel(true, "OTP sent successfully", user);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Verify OTP sent to user's email
// @route   POST /api/auth/verifyOTP
// @access  Private
const verifyOTP = asyncHandler(async (req, res, next) => {
  const otp = req.body.otp;
  const userId = req.user._id;

  try {
    const result = await userService.verifyOTP(userId, otp);
    const response = new ResponseModel(true, "OTP verified successfully", result);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Reset user password
// @route   POST /api/auth/resetPassword
// @access  Private
const resetPassword = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const password = req.body.password;

  try {
    const result = await userService.resetPassword(userId, password);
    const response = new ResponseModel(true, "Password reset successfully", result);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Get user information
// @route   GET /api/auth/getUser
// @access  Private
const getUser = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await userService.getUser(userId);
    const response = new ResponseModel(true, "User fetched successfully", user);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/updateProfile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const avatar = req.file ? req.file.filename : null;
  const { fullName, email, phoneNumber, currentPassword, newPassword } = req.body;

  try {
    const user = await userService.updateUserProfile(userId, avatar, fullName, email, phoneNumber, currentPassword, newPassword);
    const response = new ResponseModel(true, "Profile updated successfully", user);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    const response = new ResponseModel(true, "Users fetched successfully", users);
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  try {
    await userService.deleteUser(userId);
    const response = new ResponseModel(true, "User deleted successfully");
    res.status(200).json(response.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  resetPassword,
  forgotPassword,
  verifyOTP,
  getUser,
  updateUserProfile,
  getAllUsers,
  deleteUser,
};
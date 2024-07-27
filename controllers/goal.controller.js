const asyncHandler = require('express-async-handler');
const goalService = require('../services/goal.service');

// @desc    Get goals
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res, next) => {
  try {
    const goals = await goalService.getGoals(req.user._id);
    res.status(200).json(goals);
  } catch (error) {
    next(error);
  }
});

// @desc    Set goal
// @route   POST /api/goals
// @access  Private
const setGoal = asyncHandler(async (req, res, next) => {
  try {
    const goal = await goalService.setGoal(req.user._id, req.body.text);
    res.status(200).json(goal);
  } catch (error) {
    next(error);
  }
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res, next) => {
  try {
    const goal = await goalService.updateGoal(req.user._id, req.params.id, req.body);
    res.status(200).json(goal);
  } catch (error) {
    next(error);
  }
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = asyncHandler(async (req, res, next) => {
  try {
    const result = await goalService.deleteGoal(req.user._id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Admin specific routes
// @desc    Get all goals (Admin only)
// @route   GET /api/goals/admin/all
// @access  Private/Admin
const getAllGoals = asyncHandler(async (req, res, next) => {
  try {
    const goals = await goalService.getAllGoals();
    res.status(200).json(goals);
  } catch (error) {
    next(error);
  }
});

// @desc    Get a user's goals (Admin only)
// @route   GET /api/goals/admin/user/:userId
// @access  Private/Admin
const getUserGoals = asyncHandler(async (req, res, next) => {
  try {
    const goals = await goalService.getUserGoals(req.params.userId);
    res.status(200).json(goals);
  } catch (error) {
    next(error);
  }
});

// @desc    Delete any goal (Admin only)
// @route   DELETE /api/goals/admin/:id
// @access  Private/Admin
const deleteAnyGoal = asyncHandler(async (req, res, next) => {
  try {
    const result = await goalService.deleteAnyGoal(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getGoals,
  setGoal,
  updateGoal,
  deleteGoal,
  getAllGoals,
  getUserGoals,
  deleteAnyGoal,
};

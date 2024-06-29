const asyncHandler = require("express-async-handler");
const goalService = require("../services/goalService");

// @desc    Get goals
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.getGoals(req.user._id);
  res.status(200).json(goals);
});

// @desc    Set goal
// @route   POST /api/goals
// @access  Private
const setGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.setGoal(req.user._id, req.body.text);
  res.status(200).json(goal);
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(req.user._id, req.params.id, req.body);
  res.status(200).json(goal);
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = asyncHandler(async (req, res) => {
  const result = await goalService.deleteGoal(req.user._id, req.params.id);
  res.status(200).json(result);
});

module.exports = {
  getGoals,
  setGoal,
  updateGoal,
  deleteGoal,
};

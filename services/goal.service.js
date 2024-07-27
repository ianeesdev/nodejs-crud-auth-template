const Goal = require('../models/goal.model');

class GoalService {
  // Get goals service
  async getGoals(userId) {
    const goals = await Goal.find({ user: userId });
    return goals;
  }

  // Set goal service
  async setGoal(userId, text) {
    if (!text) {
      const error = new Error("Please add a text field");
      error.status = 400;
      throw error;
    }

    const goal = await Goal.create({
      text: text,
      user: userId,
    });

    return goal;
  }

  // Update goal service
  async updateGoal(userId, goalId, goalData) {
    const goal = await Goal.findById(goalId);

    if (!goal) {
      const error = new Error("Goal not found");
      error.status = 404;
      throw error;
    }

    if (goal.user.toString() !== userId) {
      const error = new Error("User not authorized");
      error.status = 401;
      throw error;
    }

    const updatedGoal = await Goal.findByIdAndUpdate(goalId, goalData, {
      new: true,
    });

    return updatedGoal;
  }

  // Delete goal service
  async deleteGoal(userId, goalId) {
    const goal = await Goal.findById(goalId);

    if (!goal) {
      const error = new Error("Goal not found");
      error.status = 404;
      throw error;
    }

    if (goal.user.toString() !== userId) {
      const error = new Error("User not authorized");
      error.status = 401;
      throw error;
    }

    await Goal.deleteOne({ _id: goalId });

    return { id: goalId };
  }

  // Get all goals (Admin only)
  async getAllGoals() {
    const goals = await Goal.find({});
    return goals;
  }

  // Get a user's goals (Admin only)
  async getUserGoals(userId) {
    const goals = await Goal.find({ user: userId });
    return goals;
  }

  // Delete any goal (Admin only)
  async deleteAnyGoal(goalId) {
    const goal = await Goal.findById(goalId);

    if (!goal) {
      const error = new Error("Goal not found");
      error.status = 404;
      throw error;
    }

    await Goal.deleteOne({ _id: goalId });

    return { id: goalId };
  }
}

module.exports = new GoalService();

const Goal = require("../models/goalModel");

class GoalService {
  // Get goals service
  async getGoals(userId) {
    const goals = await Goal.find({ user: userId });
    return goals;
  }

  // Set goal service
  async setGoal(userId, text) {
    if (!text) {
      throw new Error("Please add a text field");
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
      throw new Error("Goal not found");
    }

    if (goal.user.toString() !== userId) {
      throw new Error("User not authorized");
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
      throw new Error("Goal not found");
    }

    if (goal.user.toString() !== userId) {
      throw new Error("User not authorized");
    }

    await Goal.deleteOne({ _id: goalId });

    return { id: goalId };
  }
}

module.exports = new GoalService();

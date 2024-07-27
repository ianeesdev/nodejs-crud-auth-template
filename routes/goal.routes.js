const express = require("express");
const router = express.Router();

const { protect, admin } = require("../middleware/auth.middleware");
const { getGoals, setGoal, updateGoal, deleteGoal, getAllGoals, getUserGoals, deleteAnyGoal } = require("../controllers/goal.controller");

router.route("/").get(protect, getGoals).post(protect, setGoal);
router.route("/:id").delete(protect, deleteGoal).put(protect, updateGoal);

// Admin routes
router.route("/admin/all").get(protect, admin, getAllGoals);
router.route("/admin/user/:userId").get(protect, admin, getUserGoals);
router.route("/admin/:id").delete(protect, admin, deleteAnyGoal);

module.exports = router;

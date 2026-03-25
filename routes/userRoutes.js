// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { profile, signup, signin, getUserProfileByAdmin, logout,getUsers, getUserDetails } = require("../controllers/userController");
const { protect,adminOnly, onlyOneAdmin } = require("../middleware/authMiddleware");

router.post("/signup",onlyOneAdmin, signup);
router.post("/login", signin);
router.get("/myprofile", protect, profile);//user summary
router.post("/logout", protect, logout); //logout 

// Admin: view any user’s profile + fine details
router.get("/:userId/profile", protect, adminOnly, getUserProfileByAdmin);
router.get("/userdetails", protect, adminOnly, getUsers)
router.get("/userdetails/:userId", protect, adminOnly, getUserDetails)
module.exports = router;


const express = require("express");
const router = express.Router();
const { getSummary } = require("../controllers/summaryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Admin-only summary dashboard route
router.get("/", protect, adminOnly, getSummary);

module.exports = router;

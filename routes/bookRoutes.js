const express = require("express");
const router = express.Router();
const {getAllBooks, 
        getBookById,
        addBook,
        updateBook,
        softDeleteBook,
} = require("../controllers/bookController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// private routes
router.get("/",getAllBooks);
router.get("/:id", protect, getBookById);

// Admin routes
router.post("/add", protect, adminOnly, addBook);
router.put("/:id", protect, adminOnly,updateBook);
router.delete("/:id",protect, adminOnly,softDeleteBook);

module.exports = router;

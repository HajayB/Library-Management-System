const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  borrowBook,
  returnBook,
  getAllBorrowRecords,
  getUserBorrowRecords,
  getAllOverdueRecords,
  viewAllUsersBorrowHistory,
  updateBorrowRecord,
  getBorrowRecord, 
  getOverdueByNameOrTitle,
} = require("../controllers/borrowController");

// Member borrows a book
router.post("/borrow", protect, borrowBook);

// Member returns a book
router.put("/return/:recordId", protect, returnBook);

// Admin: view all records
router.get("/borrowed", protect, adminOnly, getAllBorrowRecords);
router.get("/overdue", protect, adminOnly, getAllOverdueRecords); //to view all overdue books with members
router.get("/overdue/search", protect, adminOnly, getOverdueByNameOrTitle); //to view overdue books by name or title
router.get("/borrowed/history/:userId",protect, adminOnly, viewAllUsersBorrowHistory)//to view all the records of a particular user


router.get("/borrowed/:recordId", protect, adminOnly, getBorrowRecord)
router.patch("/borrowed/:recordId", protect, adminOnly, updateBorrowRecord);// update borrow record (fine or due date)

// Member: view their own records
router.get("/myhistory", protect, getUserBorrowRecords);

module.exports = router;

const BorrowRecord = require('../models/borrowModel');
const Book = require('../models/bookModel');
const User = require('../models/userModel');
const { calculateFine } = require("../utils/calculateFine");

//borrow a book
exports.borrowBook = async (req, res) => {
  try {
    const { bookId, title } = req.body;

    let book;
    if (bookId) {
      book = await Book.findOne({ _id: bookId, isDeleted: false });
    } else if (title) {
      book = await Book.findOne({ title: new RegExp(title, "i"), isDeleted: false });
    } else {
      return res.status(400).json({ message: "Please provide bookId or title" });
    }

    if (!book) return res.status(404).json({ message: "Book not found or deleted" });
    if (book.availableCopies <= 0)
      return res.status(400).json({ message: "No available copies of this book" });


    // 📅 Set borrow and due dates
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // 🧾 Create a borrow record (book ID guaranteed)
    const borrowRecord = await BorrowRecord.create({
      user: req.user._id,
      book: book._id, //   use the actual book _id
      borrowDate,
      dueDate,
    });

    // 👤 Add record to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { borrowedBooks: borrowRecord._id },
    });

    // 📉 Reduce available copies
    book.availableCopies -= 1;
    await book.save();

    res
      .status(201)
      .json({ message: "Book borrowed successfully", borrowRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


// Return a book
exports.returnBook = async (req, res) => {
  try {
    const { recordId } = req.params;

    const borrowRecord = await BorrowRecord.findById(recordId).populate("book");
    if (!borrowRecord)
      return res.status(404).json({ message: "Borrow record not found" });

    if (borrowRecord.status === "returned") {
      return res.status(400).json({ message: "Book already returned" });
    }

    // Set return date to now
    borrowRecord.returnDate = new Date();

    // Determine if overdue or on time
    if (borrowRecord.returnDate > borrowRecord.dueDate) {
      borrowRecord.status = "overdue";
      borrowRecord.fineAmount = calculateFine(
        borrowRecord.dueDate,
        borrowRecord.returnDate
      );
    } else {
      borrowRecord.status = "returned";
      borrowRecord.fineAmount = 0;
    }

    // Increase book availability
    borrowRecord.book.availableCopies += 1;
    await borrowRecord.book.save();
    await borrowRecord.save();

    res.status(200).json({
      message: "Book returned successfully",
      borrowRecord: {
        id: borrowRecord._id,
        title: borrowRecord.book.title,
        status: borrowRecord.status,
        fine: borrowRecord.fineAmount,
        returnedOn: borrowRecord.returnDate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// View all borrow records (admin only)
exports.getAllBorrowRecords = async (req, res) => {
try {

  //to accept user query by name 
    const { name } = req.query;
    const now = new Date();

    // Build base query
    let query = {};

    // 🔍 If a name is provided, find matching users first
    if (name) {
      const matchingUsers = await User.find(
        { name: new RegExp(name, "i") }, // case-insensitive match
        "_id"
      );

      if (matchingUsers.length === 0) {
        return res.status(404).json({ message: "No user found with that name" });
      }

      query.user = { $in: matchingUsers.map((u) => u._id) };
    }
    const records = await BorrowRecord.find(query)
      .populate("user", "name email")
      .populate("book", "title author category")
      .sort({dueDate: - 1});

    const updates = records.map(async record => {
      const due = new Date(record.dueDate);
      let shouldUpdate = false;

      if (record.status === "borrowed" && now.getTime() > due.getTime()) {
        record.status = "overdue";
        record.fineAmount = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)) * 100);
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await record.save();
      }

      return record;
    });

    const updatedRecords = await Promise.all(updates);

    res.status(200).json(updatedRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBorrowRecord = async (req, res) => {
  const { recordId } = req.params; 

  try {
    const record = await BorrowRecord.findById(recordId)
      .populate("user", "name email")    
      .populate("book", "title category"); 
    if (!record) {
      return res.status(404).json({ message: "Borrow record not found." });
    }
     // 🔹 Recalculate overdue/fine dynamically
    const now = new Date();
    const due = new Date(record.dueDate);
   
    if (now > due) {
      // overdue
      record.status = "overdue";
      const daysLate = Math.floor((now - due) / (1000 * 60 * 60 * 24));
      record.fineAmount = daysLate * 100;
    } else if (record.status === "overdue" && now <= due) {
      // due date extended, revert to borrowed
      record.status = "borrowed";
      record.fineAmount = 0;
    }

    await record.save(); // persist changes
    res.status(200).json(record); 

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching record." });
  }
};


// View current user's borrow history
exports.getUserBorrowRecords = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "borrowedBooks",
        populate: { path: "book", select: "title author category" }
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();

    // Update overdue status and fines for any borrowed books
    const updates = user.borrowedBooks.map(async record => {
      const due = new Date(record.dueDate);
      let shouldUpdate = false;

      if (record.status === "borrowed" && now.getTime() > due.getTime()) {
        record.status = "overdue";
        record.fineAmount = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)) * 100);
        shouldUpdate = true;
      } else if (record.status === "borrowed" && now.getTime() <= due.getTime()) {
        record.status = "reading"; // still borrowed but not overdue
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        await record.save(); // persist changes
      }

      return record;
    });

    await Promise.all(updates);

    res.status(200).json({
      totalBorrowed: user.borrowedBooks.length,
      records: user.borrowedBooks.map(record => ({
        title: record.book.title,
        author: record.book.author,
        category: record.book.category,
        status: record.status,
        dueDate: record.dueDate,
        returnDate: record.returnDate,
        fineAmount: record.fineAmount,
      })),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Update fine or due date
// @route PATCH /api/borrow/:recordId
// @access Admin
exports.updateBorrowRecord = async (req, res) => {
  try {
    const { recordId } = req.params;  // ✅ matches route
    const { fineAmount, dueDate } = req.body;

    // find record
    const record = await BorrowRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: "Borrow record not found" });
    }

    // ✅ update allowed fields safely
    if (fineAmount !== undefined) record.fineAmount = fineAmount;
    if (dueDate !== undefined) record.dueDate = new Date(dueDate);

    await record.save();

    res.status(200).json({
      message: "Record updated successfully",
      record,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error while updating record" });
  }
};

//==============GET OVERDUE RECORDS=============

// Utility function to format overdue record output
function formatOverdueRecords(records, now) {
  return records.map((record) => {
    const due = new Date(record.dueDate);
    const daysLate = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    const fine =
        Math.max(0, daysLate * 100); // ₦100/day
    return {
      id: record._id,
      user: {
        name: record.user.name,
        email: record.user.email,
      },
      book: {
        title: record.book.title,
        author: record.book.author,
        category: record.book.category,
      },
      due, 
      daysLate, 
      fine,
    };
  });
}

// @desc Get all overdue borrow records
// @route GET /api/borrow/overdue
// @access Admin
exports.getAllOverdueRecords = async (req, res) => {
  try {
    const now = new Date();

    // Find all overdue records
    const overdueRecords = await BorrowRecord.find({
      status: { $in: ["borrowed", "overdue"] }, // still borrowed or already marked overdue
      dueDate: { $lt: now },
    })
      .populate("book", "title author category")
      .populate("user", "name email");

     const formatted = formatOverdueRecords(overdueRecords, now);

    res.status(200).json({
      totalOverdue: formatted.length,
      records: formatted,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc search for overdue borrow records by name or title
// @route GET /api/borrow/overdue/search
// @access Admin

exports.getOverdueByNameOrTitle = async (req, res) => {
  try {
    const { name, book } = req.query;
    const now = new Date();

    // Require at least one search term
    if (!name && !book) {
      return res.status(400).json({ message: "Please enter a name or book title to search." });
    }

    // Base overdue condition
    const baseQuery = {
      status: { $in: ["borrowed", "overdue"] },
      dueDate: { $lt: now },
    };

    const orConditions = [];

    // Lookup user IDs if name is provided
    if (name) {
      const users = await User.find({ name: new RegExp(name, "i") }, "_id");
      if (users.length > 0) {
        orConditions.push({ user: { $in: users.map(u => u._id) } });
      }
    }

    // Lookup book IDs if book title is provided
    if (book) {
      const books = await Book.find({ title: new RegExp(book, "i") }, "_id");
      if (books.length > 0) {
        orConditions.push({ book: { $in: books.map(b => b._id) } });
      }
    }

    // If search terms entered but no matching users or books found
    if (orConditions.length === 0) {
      return res.status(200).json({ message: "No overdue books matching that user or title." });
    }

    // Combine baseQuery with OR search logic
    const query = { ...baseQuery, $or: orConditions };

    const filteredRecords = await BorrowRecord.find(query)
      .populate("book", "title author category")
      .populate("user", "name email");

    if (filteredRecords.length === 0) {
      return res.status(200).json({
        message: "No overdue books matching that user or title.",
      });
    }
    
    const formatted = formatOverdueRecords(filteredRecords, now);

    res.status(200).json({
      totalOverdue: formatted.length,
      records: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// GET /api/borrow/user/:id
exports.viewAllUsersBorrowHistory = async(req,res)=>{    
  try {
    const records = await BorrowRecord.find({ userId: req.params.id })
                                      .populate("book", "title author category");
    const now = new Date();

    const history = records.map((record) => ({
      title: record.book.title,
      author: record.book.author,
      category: record.book.category,
      borrowedAt: record.borrowDate,
      dueDate: record.dueDate,
      returnedAt: record.returnDate,
      status: record.returnDate
        ? "Returned"
        : now > record.dueDate
        ? "Overdue"
        : "Still Borrowed",
    }));

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

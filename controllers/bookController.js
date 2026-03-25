const Book = require("../models/bookModel");

// @desc Get all books (search by title, author, category)
// @route GET /api/books
// @access private
exports.getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isDeleted: false };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Book.countDocuments(query);

    // Fetch books with pagination
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      books,                      // can be empty array if none found
      total,                      // total matching books
      page: Number(page),         // current page
      totalPages: Math.ceil(total / limit), // total pages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// @desc Get a single book by ID
// @route GET /api/books/:id
// @access private
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, isDeleted: false });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Add new book
// @route POST /api/books
// @access Admin
exports.addBook = async (req, res) => {
  try {
    const { title, author, category, publishedYear, isbn, totalCopies, availableCopies } = req.body;

    if (!title || !author || !category)
      return res.status(400).json({ message: "Missing required fields" });

    const newBook = await Book.create({
      title,
      author,
      isbn,
      category,
      publishedYear,
      totalCopies,
      availableCopies,
    });

    res.status(201).json({ message: "Book added successfully", newBook });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update a book
// @route PUT /api/books/:id
// @access Admin
exports.updateBook = async (req, res) => {
  try {
    const updatedBook = await Book.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: req.body },
      { new: true }
    );

    if (!updatedBook)
      return res.status(404).json({ message: "Book not found" });

    res.status(200).json({ message: "Book updated successfully", updatedBook });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Soft delete a book
// @route DELETE /api/books/:id
// @access Admin
exports.softDeleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.status(200).json({ message: "Book deleted (soft delete applied)" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

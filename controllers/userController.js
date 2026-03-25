const User = require("../models/userModel");
const BorrowRecord = require('../models/borrowModel');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getAllOverdueRecords } = require("./borrowController");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
const tokenBlacklist = [];

// @desc Register new user
// @route POST /api/users/signup
// @access Public
module.exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "member",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login user
// @route POST /api/users/login
// @access Public
module.exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//  Logout controller
exports.logout = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(400).json({ message: "No token provided" });

    tokenBlacklist.push(token); // invalidate token
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get current logged-in user
// @route GET /api/users/me
// @access Private
module.exports.profile = async (req, res) => {
 try {
    // 1️⃣ Get user (without password)
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Get all borrow records for this user
    const records = await BorrowRecord.find({ user: user._id })
      .populate("book", "title author category")
      .sort({ createdAt: -1 });

    // 3️⃣ Fine settings
    const fineRate = 100; // per day (adjust as needed)

    // 4️⃣ Calculate fines dynamically
    const borrowHistory = records.map(record => {
      let fine = 0;
      let status = record.status;

      // Calculate overdue days
      if (record.status !== "returned") {
        const now = new Date();
        if (now > record.dueDate) {
          const diffDays = Math.ceil(
            (now - record.dueDate) / (1000 * 60 * 60 * 24)
          );
          fine = diffDays * fineRate;
          status = "overdue";
        } else {
          status = "within time";
        }
      } else if (record.returnDate && record.returnDate > record.dueDate) {
        // Late return — calculate fine
        const diffDays = Math.ceil(
          (record.returnDate - record.dueDate) / (1000 * 60 * 60 * 24)
        );
        fine = diffDays * fineRate;
      }

      return {
        title: record.book?.title,
        author: record.book?.author,
        category: record.book?.category,
        borrowDate: record.borrowDate,
        dueDate: record.dueDate,
        returnDate: record.returnDate,
        status,
        fine,
      };
    });

    // 5️⃣ Calculate total fines
    const totalFine = borrowHistory.reduce((sum, b) => sum + b.fine, 0);

    // 6️⃣ Respond with complete profile
    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      totalFine,
      borrowHistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: view any user’s profile + fine details
exports.getUserProfileByAdmin = async (req, res) => {
  try {
    const { userId } = req.params; // admin passes userId in the URL
    const user = await User.findById(userId).select("-password",);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get user's borrow records
    const borrowRecords = await BorrowRecord.find({ user: userId })
      .populate("book", "title author category");

    const now = new Date();
    const fineRate = 100; // ₦100 per day overdue (adjust as you like)
    let totalFine = 0;

    // Calculate fines dynamically
    const detailedRecords = borrowRecords.map(record => {
      let fine = 0;

      if (!record.returnDate && record.dueDate < now) {
        // Not yet returned, but overdue
        const overdueDays = Math.floor((now - record.dueDate) / (1000 * 60 * 60 * 24));
        fine = overdueDays * fineRate;
      } else if (record.returnDate && record.returnDate > record.dueDate) {
        // Returned late
        const overdueDays = Math.floor((record.returnDate - record.dueDate) / (1000 * 60 * 60 * 24));
        fine = overdueDays * fineRate;
      }

      totalFine += fine;

      return {
        title: record.book?.title || "Unknown Book",
        author: record.book?.author || "Unknown",
        category: record.book?.category || "Uncategorized",
        borrowDate: record.borrowDate,
        dueDate: record.dueDate,
        returnDate: record.returnDate || null,
        status: record.returnDate
          ? record.returnDate > record.dueDate
            ? "Overdue (Returned Late)"
            : "Returned"
          : record.dueDate < now
          ? "Overdue (Not Returned)"
          : "Borrowed",
        fine
      };
    });

    res.status(200).json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        dateJoined:user.createdAt.toLocaleDateString(),
        totalFine,
      },
      records: detailedRecords
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all users
// @route GET /api/users/userdetails
// @access Private
exports.getUsers = async (req, res) => {
  try {
    // Extract query parameters from frontend
    const { search = "", filter = "all", sort = "borrowCountDesc", page = 1, limit = 5 } = req.query;

    // Build user query
    let query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    query.role = { $ne: "admin" }; // exclude admin users
        // Sorting
    let sortOption = {};
        // Fetch users with pagination
    const skip = (page - 1) * limit;
      // Fetch users based on query
      
    let users = await User.find(query).select("-password").populate({path:"borrowedBooks", select:"book status finePaid dueDate" ,
                                                          populate:{path:"book", model:"Book", select:"title -_id"}}) 
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean(); 

    // console.log(users); 
    if (sort === "nameAsc") sortOption.name = 1;
    if (sort === "nameDesc") sortOption.name = -1;
    if (sort === "borrowCountDesc") {
      users.sort((a, b) => b.borrowCount - a.borrowCount);
    } else if (sort === "borrowCountAsc") {
      users.sort((a, b) => a.borrowCount - b.borrowCount);}

      // Filtering
      if (filter === "active") {
      users = users.filter(u => u.status === "Active");
      } else if (filter === "inactive") {
      users = users.filter(u => u.status === "Inactive");
      }

        // Add borrowCount for each user
      const userIds = users.map(u => u._id);
      const borrowCounts = await BorrowRecord.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } }
      ]);

      const borrowMap = {};
      borrowCounts.forEach(b => borrowMap[b._id.toString()] = b.count);

      // Get all borrow records for these users that are either borrowed or overdue
      const activeBorrows = await BorrowRecord.find({
        user: { $in: userIds },
        status: { $in: ["borrowed", "overdue"] }
      }).lean();
      // save userIds who are active
      const activeUserIds = new Set(activeBorrows.map(b => b.user.toString()));

      // Map borrowCount and dynamic status
      users = users.map(u => ({
        ...u,
        borrowCount: borrowMap[u._id.toString()] || 0, // ✅ fixed
        status: activeUserIds.has(u._id.toString()) ? "Active" : u.status || "Inactive"
      }));

      //get each user's overdue records 
      const usersWithOverdue = await Promise.all(users.map(async (user) => {
        const overdueCount = await BorrowRecord.countDocuments({ user: user._id, status: "overdue" });
        return {
          ...user,
          overdueCount
        };
      }));
      users = usersWithOverdue;

      //get user's total accumulated fine
      const userFine = await Promise.all(users.map( async (user) => {
        const overdueRecords = await BorrowRecord.find({ user: user._id, fineAmount: { $gt: 0 }, finePaid: false }).lean();

        const totalFine = overdueRecords.reduce((sum, r)=> sum + r.fineAmount, 0);
        return {
          ...user,
          totalFine
        };
      }));
      users = userFine;

      // Get last borrowed date for each user
      const lastBorrowedMap = {};
      const lastBorrows = await BorrowRecord.aggregate([
        { $match: { user: { $in: userIds } } },
        { $sort: { borrowDate: -1 } },
        {
          $group: {
            _id: "$user",
            lastBorrowDate: { $first: "$borrowDate" }
          }
        }
      ]);
      lastBorrows.forEach(lb => {
        lastBorrowedMap[lb._id.toString()] = lb.lastBorrowDate.toLocaleDateString();
      });

      // Attach lastBorrowDate to users
      users = users.map(u => ({
        ...u,
        lastBorrowDate: lastBorrowedMap[u._id.toString()] || null
      }));    


    // Total count for pagination
    const total = await User.countDocuments(query);
    


    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// @desc Get single user's details
// @route GET /api/users/userdetails/:userId
// @access Private

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ message: "User ID is required" });

    // Fetch user without password
    const user = await User.findById(userId)
      .select("-password")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // Borrow count
    const borrowCount = await BorrowRecord.countDocuments({ user: userId });

    // Overdue books count
    const overdueCount = await BorrowRecord.countDocuments({ user: userId, status: "overdue" });

    // Total accumulated fines for unpaid fines
    const overdueRecords = await BorrowRecord.find({ user: userId, fineAmount: { $gt: 0 }, finePaid: false }).lean();
    const totalFine = overdueRecords.reduce((sum, r) => sum + r.fineAmount, 0);

    // Last activity (last borrow date)
    const lastBorrow = await BorrowRecord.find({ user: userId }).sort({ borrowDate: -1 }).limit(1).lean();
    const lastActive = lastBorrow.length ? lastBorrow[0].borrowDate : null;

    // Borrow history (all borrowed books with title and status)
    const borrowHistoryRaw = await BorrowRecord.find({ user: userId })
      .populate({ path: "book", model: "Book", select: "title -_id" })
      .sort({ borrowDate: -1 })
      .lean();

    const borrowHistory = borrowHistoryRaw.map(b => ({
      title: b.book?.title || "Unknown",
      status: b.status === "borrowed" ? "Due " + (b.dueDate ? new Date(b.dueDate).toLocaleDateString() : "") : b.status.charAt(0).toUpperCase() + b.status.slice(1)
    }));

    // Determine status dynamically
    const activeBorrow = await BorrowRecord.findOne({ user: userId, status: { $in: ["borrowed", "overdue"] } });
    const status = activeBorrow ? "Active" : "Inactive";

    // Return combined data
    res.json({
      user: {
        ...user,
        status,
        borrowCount,
        overdueBooks: overdueCount,
        totalFines: totalFine,
        lastActive,
        borrowHistory
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.getUserDetails = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!userId) return res.status(400).json({ message: "User ID is required" });

//     // Fetch user without password
//     const user = await User.findById(userId)
//       .select("-password")
//       .lean();

//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Borrow count
//     const borrowCount = await BorrowRecord.countDocuments({ user: userId });

//     // Overdue books count
//     const overdueCount = await BorrowRecord.countDocuments({ user: userId, status: "overdue" });

//     // Total accumulated fines for unpaid fines
//     const overdueRecords = await BorrowRecord.find({ user: userId, fineAmount: { $gt: 0 }, finePaid: false }).lean();
//     const totalFine = overdueRecords.reduce((sum, r) => sum + r.fineAmount, 0);

//     // Last activity (last borrow date)
//     const lastBorrow = await BorrowRecord.find({ user: userId }).sort({ borrowDate: -1 }).limit(1).lean();
//     const lastActive = lastBorrow.length ? lastBorrow[0].borrowDate : null;

//     // Borrow history (all borrowed books with title and status)
//     const borrowHistoryRaw = await BorrowRecord.find({ user: userId })
//       .populate({ path: "book", model: "Book", select: "title -_id" })
//       .sort({ borrowDate: -1 })
//       .lean();

//     const borrowHistory = borrowHistoryRaw.map(b => ({
//       title: b.book?.title || "Unknown",
//       status: b.status === "borrowed" ? "Due " + (b.dueDate ? new Date(b.dueDate).toLocaleDateString() : "") : b.status.charAt(0).toUpperCase() + b.status.slice(1)
//     }));

//     // Return combined data
//     res.json({
//       user: {
//         ...user,
//         borrowCount,
//         overdueBooks: overdueCount,
//         totalFines: totalFine,
//         lastActive,
//         borrowHistory
//       }
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

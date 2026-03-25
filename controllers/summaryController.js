const User = require("../models/userModel");
const Book = require("../models/bookModel");
const BorrowRecord = require("../models/borrowModel");

exports.getSummary = async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const now = new Date();
    let startDate, endDate;

    // 🧭 Option 1: Custom range via from/to
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      // 🧭 Option 2: Predefined ranges (1w, 3m, 6m)
      switch (range) {
        case "1w":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "3m":
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case "6m":
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        default:
          startDate = null;
      }
      endDate = new Date();
    }

    // 🧩 Build filter object
    const dateFilter = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
    const filter = Object.keys(dateFilter).length
      ? { borrowDate: dateFilter }
      : {};

    // 📊 Parallel DB calls for efficiency
    const [
      totalUsers,
      totalBooks,
      borrowRecords,
      mostBorrowedBooks,

      //users = used to compute "joined this month"
      users
    ] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      BorrowRecord.find(filter).populate("book", "category title"),
      BorrowRecord.aggregate([
        Object.keys(dateFilter).length
          ? { $match: { borrowDate: dateFilter } }
          : { $match: {} },
        { $group: { _id: "$book", borrowCount: { $sum: 1 } } },
        { $sort: { borrowCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "books",
            localField: "_id",
            foreignField: "_id",
            as: "bookInfo"
          }
        },
        { $unwind: "$bookInfo" },
        {
          $project: {
            _id: 0,
            bookId: "$bookInfo._id",
            title: "$bookInfo.title",
            category: "$bookInfo.category",
            borrowCount: 1
          }
        }
      ]),
      User.find({}, "createdAt _id")
    ]);

    // 🆕 NEW: Users who joined this month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const usersJoinedThisMonth = users.filter(u =>{
      const created = new Date(u.createdAt);
      created >= firstDayOfMonth && created < firstDayOfNextMonth
  }).length;

    // 🆕 NEW: Unique users who have overdue books
    const overdueUserIds = await BorrowRecord.distinct("user", {
      dueDate: { $lt: new Date() },
      status: "overdue"
    });
    const usersWithOverdue = overdueUserIds.length;

    // 🧮 Compute analytics
    const borrowedBooks = borrowRecords.filter(b => b.status === "borrowed").length;
    const overdueBooks = borrowRecords.filter(b => b.status === "overdue").length;
    const returnedBooks = borrowRecords.filter(b => b.status === "returned").length;

    // Category distribution
    const categoryStats = {};
    borrowRecords.forEach(rec => {
      const category = rec.book?.category || "Uncategorized";
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    // Monthly trend
    const monthlyStats = {};
    borrowRecords.forEach(rec => {
      const month = new Date(rec.borrowDate).toLocaleString("default", { month: "short" });
      monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    });

    // 📦 Response
    res.status(200).json({
      stats: {
        totalUsers,
        totalBooks,
        borrowedBooks,
        overdueBooks,
        returnedBooks,
        activeMembers: borrowedBooks + overdueBooks,

        // 🔥 NEW
        usersJoinedThisMonth,
        usersWithOverdue
      },
      charts: {
        categoryChart: Object.entries(categoryStats).map(([label, value]) => ({ label, value })),
        monthlyChart: Object.entries(monthlyStats).map(([month, count]) => ({ month, count })),
        statusChart: [
          { status: "Borrowed", count: borrowedBooks },
          { status: "Returned", count: returnedBooks },
          { status: "Overdue", count: overdueBooks }
        ]
      },
      highlights: {
        mostBorrowedBooks
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching summary" });
  }
};

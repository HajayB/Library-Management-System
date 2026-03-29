const User = require("../models/userModel");
const Book = require("../models/bookModel");
const BorrowRecord = require("../models/borrowModel");

exports.getSummary = async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const now = new Date();

    // Compute month boundaries BEFORE now is mutated below
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      const ref = new Date(); // use separate copy so `now` stays clean
      switch (range) {
        case "1w":
          startDate = new Date(ref.setDate(ref.getDate() - 7));
          break;
        case "3m":
          startDate = new Date(ref.setMonth(ref.getMonth() - 3));
          break;
        case "6m":
          startDate = new Date(ref.setMonth(ref.getMonth() - 6));
          break;
        default:
          startDate = null;
      }
      endDate = new Date();
    }

    const dateFilter = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
    const filter = Object.keys(dateFilter).length ? { borrowDate: dateFilter } : {};

    const matchStage = Object.keys(dateFilter).length
      ? [{ $match: { borrowDate: dateFilter } }]
      : [];

    // All DB queries run in parallel — no full-collection loads
    const [
      totalUsers,
      totalBooks,
      borrowedBooks,
      overdueBooks,
      returnedBooks,
      mostBorrowedBooks,
      usersJoinedThisMonth,
      overdueUserIds,
      categoryData,
      monthlyData,
    ] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      BorrowRecord.countDocuments({ ...filter, status: "borrowed" }),
      BorrowRecord.countDocuments({ ...filter, status: "overdue" }),
      BorrowRecord.countDocuments({ ...filter, status: "returned" }),

      BorrowRecord.aggregate([
        ...matchStage,
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

      User.countDocuments({
        createdAt: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
      }),

      BorrowRecord.distinct("user", {
        dueDate: { $lt: new Date() },
        status: "overdue"
      }),

      // Category distribution via aggregation (no full load)
      BorrowRecord.aggregate([
        ...matchStage,
        {
          $lookup: {
            from: "books",
            localField: "book",
            foreignField: "_id",
            as: "bookInfo"
          }
        },
        { $unwind: { path: "$bookInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$bookInfo.category", "Uncategorized"] },
            value: { $sum: 1 }
          }
        },
        { $project: { _id: 0, label: "$_id", value: 1 } }
      ]),

      // Monthly trend via aggregation — grouped by year+month so ordering is correct
      BorrowRecord.aggregate([
        ...matchStage,
        {
          $group: {
            _id: {
              year: { $year: "$borrowDate" },
              month: { $month: "$borrowDate" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id: 0,
            month: {
              $let: {
                vars: {
                  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                },
                in: {
                  $concat: [
                    { $arrayElemAt: ["$$months", { $subtract: ["$_id.month", 1] }] },
                    " '",
                    { $substrCP: [{ $toString: "$_id.year" }, 2, 2] }
                  ]
                }
              }
            },
            count: 1
          }
        }
      ]),
    ]);

    const usersWithOverdue = overdueUserIds.length;

    res.status(200).json({
      stats: {
        totalUsers,
        totalBooks,
        borrowedBooks,
        overdueBooks,
        returnedBooks,
        activeMembers: borrowedBooks + overdueBooks,
        usersJoinedThisMonth,
        usersWithOverdue,
      },
      charts: {
        categoryChart: categoryData,
        monthlyChart: monthlyData,
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

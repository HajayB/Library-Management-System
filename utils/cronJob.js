// cron/fineUpdater.js
const cron = require("node-cron");
const BorrowRecord = require("../models/borrowModel");
const User = require("../models/userModel"); // only if needed for populate

// Runs every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running fine update job at midnight...");

  try {
    const now = new Date();

    const records = await BorrowRecord.find().populate("user", "name email");

    for (const record of records) {
      const due = new Date(record.dueDate);

      if (record.status === "borrowed" && now > due) {
        record.status = "overdue";
        record.fineAmount = Math.max(
          0,
          Math.floor((now - due) / (1000 * 60 * 60 * 24)) * 100
        );
        await record.save();
      }
    }

    console.log("✅ Fine update job completed successfully");
  } catch (err) {
    console.error("❌ Fine update job failed:", err);
  }
});


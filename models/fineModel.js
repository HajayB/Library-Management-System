const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  borrowRecord: { type: mongoose.Schema.Types.ObjectId, ref: "BorrowRecord", required: true },
  amount: { type: Number, required: true },
  paidStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Fine", fineSchema);

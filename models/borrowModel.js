const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  fineAmount:{type:Number, default:0},
  finePaid: { type: Boolean, default: false },
  status: { type: String, enum: ['borrowed', 'returned', 'overdue'], default: 'borrowed' }
}, { timestamps: true });

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);

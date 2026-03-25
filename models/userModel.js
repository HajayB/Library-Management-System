const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  borrowedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "BorrowRecord" }], //gotten from borrowController
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);

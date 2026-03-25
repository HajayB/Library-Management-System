const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true },
  category: {
    type: String,
    enum: ['Fiction', 'Non-Fiction', 'Romance', 'Technology', 
            'History', 'Children', 'Education', 'Fantasy',
            'Biography', 'Erotica','Horror', 'Other'],
    required: true
  },
  publishedYear: Number,
  totalCopies: { type: Number, required: true },
  availableCopies: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false },
}, 
{ timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);

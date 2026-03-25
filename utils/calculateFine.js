const {dueDate, returnDate} = require('../models/fineModel')

module.exports.calculateFine = (dueDate, returnDate) => {
  const FINE_RATE_PER_DAY = 100; // ₦100 per day


  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  const dueMidnight = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const returnedMidnight = Date.UTC(returned.getFullYear(), returned.getMonth(), returned.getDate());

  const diffDays = Math.floor((returnedMidnight - dueMidnight) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * FINE_RATE_PER_DAY : 0;
};

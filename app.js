const dotenv = require("dotenv");
const express = require("express");
const app = express();

const connectDB = require("./config/db");
const fs = require('fs');
const path = require('path');
require("./utils/cronJob")// Import cron jobs to run them


// Load environment variables

dotenv.config();
// Connect to MongoDB
connectDB();
// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static folder 
app.use(express.static(path.join(__dirname, "public")));

// Routes
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const summaryRoutes = require('./routes/summaryRoutes');
const userRoutes = require('./routes/userRoutes');

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api", borrowRoutes);
app.use("/api/summary", summaryRoutes); //admin only route


// 🔹 Frontend routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/users/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

app.get("/api/users/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/api/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/api/users/dashboard", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "userDash.html"));
})

app.get("/api/users/library", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "userBooks.html"));
})

app.get("/api/users/admin/dashboard", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "adminDash.html"));
})

app.get("/api/users/admin/usermanagement", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "userManagement.html"));
})

app.get("/api/users/admin/bookmanagement", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "bookManagement.html"));
})

app.get("/api/users/admin/borrowedrecords", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "borrowRecords.html"));
})

app.get("/api/users/admin/overdue", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "overDue.html"));
})

app.get("/api/users/summary", (req,res)=>{
  res.sendFile(path.join(__dirname, "public", "summary.html"))
})

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
  next();
});

// Error handler
const {errorHandler} = require('./middleware/errorhandler');
app.use(errorHandler);


const PORT = process.env.PORT || 3500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
















// // Root endpoint
// app.get("/", (req, res) => {
//   res.json({ message: "Library Management System API is running 🚀" });
// });


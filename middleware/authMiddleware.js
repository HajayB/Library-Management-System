const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

module.exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }
    if (!token) {
    return res.status(401).json({ message: "No token provided" });
    }

    next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

module.exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
};

module.exports.onlyOneAdmin = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount >= 1) {
      return res.status(400).json({ message: "Only one admin allowed" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
const jwt = require("jsonwebtoken");
const Users = require("../models/userModel");
const verifyAuth = async (req, res, next) => {
  let token;

  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      req.user = await Users.findById({ _id: decoded.id });

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Unauthorized action, invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Unauthorized action,No token");
  }
};

const verifyAdmin = (req, res, next) => {
  const user = req.user;

  if (user.role !== "admin") {
    res.status(401);
    throw new Error("Unauthorized action");
  }

  next();
};

module.exports = { verifyAuth, verifyAdmin };

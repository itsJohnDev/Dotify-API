const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const { StatusCodes } = require("http-status-codes");
// Protect specific routes with middleware  - verify JWT token then set req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (!req.headers.authorization) {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error("No token found in header.");
  }

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get the token from the header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT);

      //   Set req.user to the user found with the token
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      console.log(error);
      res.status(StatusCodes.UNAUTHORIZED);

      throw new Error("Unauthorized");
    }
  }
});

module.exports = { protect };

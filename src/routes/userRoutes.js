const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/userController");
const { protect } = require("../../middleware/auth");
const upload = require("../../middleware/upload");
const userRouter = express.Router();

// Public
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Private
userRouter.get("/profile", protect, getUserProfile);
userRouter.put(
  "/profile",
  protect,
  upload.single("profilePicture"),
  updateUserProfile
);

module.exports = userRouter;

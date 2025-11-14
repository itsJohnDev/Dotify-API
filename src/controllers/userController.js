const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc - Register a new user
// @desc - POST /api/users/register
// @Access - Public
const registerUser = asyncHandler(async (req, res) => {
  // get the payload
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("User alerady exists");
  }

  // Create a new user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(StatusCodes.CREATED).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
    });
  } else {
    res.status(StatusCodes.BAD_REQUEST);
  }
});

// @desc - Login a new user
// @desc - POST /api/users/login
// @Access - Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Find user
  const user = await User.findOne({ email });

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    res.status(StatusCodes.OK).json({
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      profilePicture: user.profilePicture,
      token: generateToken(user._id),
    });
  } else {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error("Invalid email or password");
  }
});

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  console.log("Profile page visited", req.user);
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {});
// Toggle like song
const toggleLikeSong = asyncHandler(async (req, res) => {});
// Toggle follow artist
const toggleFollowArtist = asyncHandler(async (req, res) => {});
// Toggle follow playlist
const toggleFollowPlaylist = asyncHandler(async (req, res) => {});
// getUsers
const getUsers = asyncHandler(async (req, res) => {});

module.exports = { registerUser, loginUser, getUserProfile };

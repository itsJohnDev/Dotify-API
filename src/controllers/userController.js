const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

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
  // Find user
  const user = await User.findById(req.user._id).select("-password");

  if (user) {
    res.status(StatusCodes.OK).json(user);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User Not Found");
  }
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { name, email, password } = req.body;

  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;

    // Check if password is being updated
    if (password) {
      user.password = password;
    }

    // Upload profile picture if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, "dotify/users");
      user.profilePicture = result.secure_url;
    }

    const updatedUser = await user.save();

    res.status(StatusCodes.OK).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User not found");
  }
});
// Toggle like song
const toggleLikeSong = asyncHandler(async (req, res) => {});
// Toggle follow artist
const toggleFollowArtist = asyncHandler(async (req, res) => {});
// Toggle follow playlist
const toggleFollowPlaylist = asyncHandler(async (req, res) => {});
// getUsers
const getUsers = asyncHandler(async (req, res) => {});

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };

const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Playlist = require("../models/Playlist");

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
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("likedSongs", "title artist duration");

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
const toggleLikeSong = asyncHandler(async (req, res) => {
  const songId = req.params.id;
  const song = await Song.findById(songId);
  const user = await User.findById(req.user._id);

  if (!song) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User not found");
  }

  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User not found");
  }

  // Check if song is already liked
  const songIndex = user.likedSongs.indexOf(songId);
  if (songIndex === -1) {
    // Add song to liked songs
    user.likedSongs.push(songId);
    // Increase song likes
    song.likes += 1;
  } else {
    // Remove song from liked songs
    user.likedSongs.splice(songIndex, 1);
    // Decrement song's like count but won't go below zero
    if (song.likes > 0) {
      song.likes -= 1;
    }
  }

  await Promise.all([user.save(), song.save()]);

  res.status(StatusCodes.OK).json({
    likedSongs: user.likedSongs,
    message:
      songIndex === -1
        ? "Song added to liked songs"
        : "Song removed from liked songs",
  });
});
// Toggle follow artist
const toggleFollowArtist = asyncHandler(async (req, res) => {
  const artistId = req.params.id;
  const user = await User.findById(req.user._id);
  const artist = await Artist.findById(artistId);

  if (!artist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist not found");
  }

  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User not found");
  }

  console.log(artistId);

  // Check if artist is already followed
  const artistIndex = user.followedArtists.indexOf(artistId);
  if (artistIndex === -1) {
    // Add song to liked songs
    user.followedArtists.push(artistId);
    artist.followers += 1;
  } else {
    // Remove song from liked songs
    user.followedArtists.splice(artistIndex, 1);
    // Decerement followers count but won't go below zero
    if (artist.followers > 0) {
      artist.followers -= 1;
    }
  }

  await Promise.all([user.save(), artist.save()]);

  res.status(StatusCodes.OK).json({
    followedArtists: user.followedArtists,
    message: artistIndex === -1 ? "Artist followed" : "Artist unfollowed",
  });
});
// Toggle follow playlist
const toggleFollowPlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params.id;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User not found");
  }

  // Check playlist if exists
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }

  // Check if playlist is already followed
  const playlistIndex = user.followedPlaylists.indexOf(playlistId);

  if (playlistIndex === -1) {
    // Add playlist to followed playlist
    user.followedPlaylists.push(playlistId);
    // Increment playlist's followers count
    playlist.followers += 1;
  } else {
    // Remove song from liked songs
    user.followedPlaylists.splice(playlistIndex, 1);
    // Decerement followers count but won't go below zero
    if (playlist.followers > 0) {
      playlist.followers -= 1;
    }
  }

  await Promise.all([user.save(), playlist.save()]);

  res.status(StatusCodes.OK).json({
    followedPlaylist: user.followedPlaylists,
    message: playlistIndex === -1 ? "Playlist followed" : "Playlist unfollowed",
  });
});
// getUsers
const getUsers = asyncHandler(async (req, res) => {});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  toggleLikeSong,
  toggleFollowArtist,
  toggleFollowPlaylist,
};

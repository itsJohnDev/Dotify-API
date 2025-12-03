const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Song = require("../models/Song");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
const Playlist = require("../models/Playlist");
const User = require("../models/User");

// @desc - Create A New Playlist
// @route - POST /api/playlists
// @Access - Private/Admin
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, isPublic } = req.body;

  // Validations
  if (!name || !description) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Name description are required.");
  }

  if (name.length < 3 || name.length > 50) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Name must be between 3 and 50 characters");
  }

  if (description.length < 10 || description.length > 200) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Description must be between 10 and 200 characters");
  }

  //   Check if playlist already exists
  const existingPlaylist = await Playlist.findOne({
    name,
    creator: req.user._id,
  });

  if (existingPlaylist) {
    throw new Error("A playlist with this name already exists");
  }

  //   Upload playlist cover image if provided
  let coverImageUrl = "";
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "dotify/playlists");
    coverImageUrl = result.secure_url;
  }

  //   Create the playlist
  const playlist = await Playlist.create({
    name,
    description,
    creator: req.user._id,
    coverImage: coverImageUrl,
    isPublic: isPublic === "true",
  });

  res.status(StatusCodes.CREATED).json(playlist);
});

// @desc - Get All Playlists With Filtering And Pagination
// @route - GET /api/playlists?search=name&page=1&limit=10;
// @Access - Public
const getPlaylists = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const filter = { isPublic: true }; // Search only public playlists
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Count total playlists with filter
  const count = await Playlist.countDocuments(filter);

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get Playlists
  const playlists = await Playlist.find(filter)
    .sort({ followers: -1 })
    .limit(limit)
    .skip(skip)
    .populate("creator", "name profilePicture")
    .populate("collaborators", "name profilePicture");

  res.status(StatusCodes.OK).json({
    playlists,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalAlbums: count,
  });
});

// @desc - Get User Playlist
// @route - GET /api/user/me
// @Access - Private
const getUserPlaylists = asyncHandler(async (req, res) => {
  const playlist = await Playlist.find({
    $or: [{ creator: req.user._id }, { collaborators: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate("creator", "name profilePicture");

  res.status(StatusCodes.OK).json(playlist);
});

// @desc - Get Playlist By ID
// @route - GET /api/playlists/:id
// @Access - Public
const getPlaylistById = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id)
    .populate("creator", "name profilePicture")
    .populate("collaborators", "name profilePicture");

  // Check If Playlist Exists
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }
  // Check If Playlist Is Private And Current User Is Not The Current Creator Or Collaborator
  if (
    !playlist.isPublic &&
    !(
      req.user &&
      (playlist.creator.equals(req.user._id) ||
        playlist.collaborators.some((collab) => collab.equals(req.user._id)))
    )
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("This playlist is private");
  }

  res.status(StatusCodes.OK).json(playlist);
});

// @desc - Update Playlist
// @route - PUT /api/playlists/:id
// @Access - Private
const updatePlaylist = asyncHandler(async (req, res) => {
  const { name, description, isPublic } = req.body;

  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }

  // Check if current user is creator or collaborator
  if (
    !playlist.creator.equals(req.user._id) &&
    !playlist.collaborators.some((collab) => collab.equals(req.user._id))
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized to update this playlist");
  }

  // Update the playlist
  playlist.name = name || playlist.name;
  playlist.description = description || playlist.description;

  if (playlist.creator.equals(req.user._id)) {
    playlist.isPublic =
      isPublic !== undefined ? isPublic === "true" : playlist.isPublic;
  }

  // Update cover image if provided
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "dotify/playlists");
    playlist.coverImage = result.secure_url;
  }

  const updatedPlaylist = await playlist.save();
  res.status(StatusCodes.OK).json(updatedPlaylist);
});

// @desc - Delete Playlist
// @route - DELETE /api/playlists/:id
// @Access - Private
const deletePlaylist = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }

  // Check if current user is creator of playlist
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized to delete playlist");
  }

  await playlist.deleteOne();
  res.status(StatusCodes.OK).json({ message: "Playlist removed" });
});

// @desc - Add Song To Playlist
// @route - PUT /api/playlists/:id/add-songs
// @Access - Private
const addSongsToPlaylist = asyncHandler(async (req, res) => {
  const { songIds } = req.body;

  if (!songIds || !Array.isArray(songIds)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Song IDS are required");
  }

  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }

  // Check if current user is creator or collaborator
  if (
    !playlist.creator.equals(req.user._id) &&
    !playlist.collaborators.some((collab) => collab.equals(req.user._id))
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized to modify playlist");
  }

  // Add songs to playlist
  for (const songId of songIds) {
    // Check if song exists
    const song = await Song.findById(songId);

    if (!song) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error("Song does not exist");
    }

    // check if song already in playlist
    if (playlist.songs.includes(songId)) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error("Song already in the playlist");
    }

    playlist.songs.push(songId);
  }

  await playlist.save();
  res.status(StatusCodes.OK).json(playlist);
});

// @desc - Remove Song From Playlist
// @route - PUT /api/playlists/:id/remove-song/:songId
// @Access - Private
const removeSongFromPlaylist = asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }

  // Check if current user is creator or collaborator
  if (
    !playlist.creator.equals(req.user._id) &&
    !playlist.collaborators.some((collab) => collab.equals(req.user._id))
  ) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Not authorized to modify playlist");
  }

  const songId = req.params.songId;
  // Check song if in the playlist
  if (!playlist.songs.includes(songId)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Song is not in the playlist");
  }

  // remove song from playlist;
  playlist.songs = playlist.songs.filter((id) => id.toString() !== songId);

  await playlist.save();
  res.status(StatusCodes.OK).json(playlist);
});

// @desc - Add Collaborator To Playlist
// @route - PUT /api/playlists/:id/add-collaborator
// @Access - Private
const addCollaborator = asyncHandler(async (req, res) => {
  const userId = req.body.userId;

  if (!userId) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("User ID is required");
  }

  // Check is user exist
  const user = await User.findById(userId);
  if (!user) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("User ID is required");
  }

  // Check if playlist
  const playlist = await Playlist.findById(req.params.id);

  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }

  // Only creator can add collaborators
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Only playlist creator can add collaborators");
  }

  // Check if user is already a collaborator
  if (playlist.collaborators.includes(userId)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("User is already a collaborator");
  }

  // Add user to collaborators
  playlist.collaborators.push(userId);

  await playlist.save();
  res.status(StatusCodes.OK).json({ message: "Added collaborator", playlist });
});

// @desc - Remove Collaborator From Playlist
// @route - PUT /api/playlists/:id/add-collaborator
// @Access - Private
const removeCollaborator = asyncHandler(async (req, res) => {
  const userId = req.body.userId;

  // Check if playlist
  const playlist = await Playlist.findById(req.params.id);
  if (!playlist) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Playlist not found");
  }

  // Only creator can remove collaborators
  if (!playlist.creator.equals(req.user._id)) {
    res.status(StatusCodes.FORBIDDEN);
    throw new Error("Only playlist creator can add collaborators");
  }

  // Check if user is already a collaborator
  if (!playlist.collaborators.includes(userId)) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("User is not a collaborator");
  }

  // remove song from playlist;
  playlist.collaborators = playlist.collaborators.filter(
    (id) => id.toString() !== userId
  );

  await playlist.save();
  res
    .status(StatusCodes.OK)
    .json({ message: "Removed collaborator", playlist });
});

// @desc -  Get Featured Playlist
// @route - GET /api/playlists/featured?limit=5
// @Access - Public
const getFeaturedPlaylists = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const filter = { isPublic: true };

  const playlists = await Playlist.find(filter)
    .limit(limit)
    .sort({ followers: -1 })
    .populate("creator", "name profilePicture");

  res.status(StatusCodes.OK).json(playlists);
});

module.exports = {
  createPlaylist,
  getPlaylists,
  getPlaylistById,
  updatePlaylist,
  getUserPlaylists,
  deletePlaylist,
  addSongsToPlaylist,
  removeSongFromPlaylist,
  addCollaborator,
  removeCollaborator,
  getFeaturedPlaylists,
};

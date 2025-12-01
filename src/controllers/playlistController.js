const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const Song = require("../models/Song");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
const Playlist = require("../models/Playlist");

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
const getPlaylists = asyncHandler(async (req, res) => {});

// @desc - Get User Playlist
// @route - GET /api/user/me
// @Access - Private
const getUserPlaylists = asyncHandler(async (req, res) => {});

// @desc - Get Playlist By ID
// @route - GET /api/playlists/:id
// @Access - Public
const getPlaylistById = asyncHandler(async (req, res) => {});

// @desc - Update Playlist
// @route - PUT /api/playlists/:id
// @Access - Private
const updatePlaylist = asyncHandler(async (req, res) => {});

// @desc - Delete Playlist
// @route - DELETE /api/playlists/:id
// @Access - Private
const deletePlaylist = asyncHandler(async (req, res) => {});

// @desc - Add Song To Playlist
// @route - PUT /api/playlists/:id/add-songs
// @Access - Private
const addSongsToPlaylist = asyncHandler(async (req, res) => {});

// @desc - Remove Song From Playlist
// @route - PUT /api/playlists/:id/remove-song/:songId
// @Access - Private
const removeSongFromPlaylist = asyncHandler(async (req, res) => {});

// @desc - Add Collaborator To Playlist
// @route - PUT /api/playlists/:id/add-collaborator
// @Access - Private
const addCollaborator = asyncHandler(async (req, res) => {});

// @desc - Remove Collaborator From Playlist
// @route - PUT /api/playlists/:id/add-collaborator
// @Access - Private
const removeCollaborator = asyncHandler(async (req, res) => {});

// @desc -  Get Featured Playlist
// @route - GET /api/playlists/featured?limit=5
// @Access - Public
const getFeaturedPlaylists = asyncHandler(async (req, res) => {});

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

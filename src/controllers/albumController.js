const asyncHandler = require("express-async-handler");
const { StatusCodes } = require("http-status-codes");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const Song = require("../models/Song");
const uploadToCloudinary = require("../utils/cloudinaryUpload");

// @desc - Create a new Album
// @route - POST /api/albums
// @Access - Private/admin
const createAlbum = asyncHandler(async (req, res) => {
  if (!req.body) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Request body is required");
  }

  const { title, artistId, releasedDate, genre, description, isExplicit } =
    req.body;

  // Validate
  if (
    !title ||
    !artistId ||
    !releasedDate ||
    !genre ||
    !description ||
    !isExplicit
  ) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("");
  }
  if (title.length < 3 || title.length > 100) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Title must be between 3 and 100 characters.");
  }
  if (title.length < 10 || title.length > 200) {
    res.status(StatusCodes.BAD_REQUEST);
    throw new Error("Description must be between 10 and 200 characters.");
  }

  //   Check album if already exists
  const albumExists = await Album.findOne({ title });
  if (albumExists) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Album already exists");
  }

  //   Check artist if already exists
  const artists = await Artist.findById(artistId);
  if (!artists) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Artist not found");
  }

  //   Upload cover image if provided
  let coverImage = "";
  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "dotify/albums");

    coverImage = result.secure_url;
  }
  //   Create an Album
  const album = await Album.create({
    title,
    artist: artistId,
    releasedDate: releasedDate ? new Date(releasedDate) : Date.now(),
    coverImage,
    genre,
    description,
    isExplicit: isExplicit === "true",
  });

  //   Add album to artist's albums
  artists.albums.push(album._id);
  await artists.save();
  res.status(StatusCodes.CREATED).json(album);
});

// @desc - Get all albums with filtering and pagination
// @route - GET /api/albums
// @Access - Public
const getAllAlbums = asyncHandler(async (req, res) => {
  res.send("Get all albums");
});

// @desc - Get album by ID
// @route - GET /api/albums/:id
// @Access - Public
const getAlbumById = asyncHandler(async (req, res) => {
  res.send("Get album by ID");
});

// @desc - Update album details
// @route - PUT /api/albums/:id
// @Access - Private/Admin
const updateAlbum = asyncHandler(async (req, res) => {
  res.send("Update album details");
});

// @desc - Update album details
// @route - DELETE /api/albums/:id
// @Access - Private/Admin
const deleteAlbum = asyncHandler(async (req, res) => {
  res.send("Delete an album");
});

// @desc - Add songs to album
// @route - PUT /api/albums/:id/add-songs
// @Access - Private/Admin
const addSongsToALbum = asyncHandler(async (req, res) => {
  res.send("Add song to album");
});

// @desc - Remove songs from album
// @route - PUT /api/albums/:id/add-songs/:id
// @Access - Private/Admin
const removeSongsFromAlbum = asyncHandler(async (req, res) => {
  res.send("Remove songs from Album");
});

// @desc - Get new releases (recently added albums)
// @route - PUT /api/albums/new-releases?limit=10
// @Access - Public
const getNewReleases = asyncHandler(async (req, res) => {
  res.send("Get new releases");
});

module.exports = {
  createAlbum,
  getAllAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongsToALbum,
  removeSongsFromAlbum,
  getNewReleases,
};

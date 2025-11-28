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
    isExplicit: isExplicit === "false",
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
  const { genre, artist, search, page = 1, limit = 10 } = req.query;

  //   Build filter object
  const filter = {};
  if (genre) filter.genre = genre;
  if (artist) filter.artist = artist;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { genre: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Count total albums with filter
  const count = await Album.countDocuments(filter);
  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get Albums
  const albums = await Album.find(filter)
    .sort({ releasedDate: -1 })
    .limit(limit)
    .skip(skip)
    .populate("artist", "name image");

  res.status(StatusCodes.OK).json({
    albums,
    page: parseInt(page),
    pages: Math.ceil(count / parseInt(limit)),
    totalAlbums: count,
  });
});

// @desc - Get album by ID
// @route - GET /api/albums/:id
// @Access - Public
const getAlbumById = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id).populate(
    "artist",
    "name image bio"
  );

  if (album) {
    res.status(StatusCodes.OK).json(album);
  } else {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Album not found");
  }
});

// @desc - Update album details
// @route - PUT /api/albums/:id
// @Access - Private/Admin
const updateAlbum = asyncHandler(async (req, res) => {
  const { title, releasedDate, genre, description, isExplicit } = req.body;

  const album = await Album.findById(req.params.id);

  if (!album) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Album not found");
  }

  // Update artist details
  album.title = title || album.title;
  album.releasedDate = releasedDate || album.releasedDate;
  album.genre = genre || album.genre;
  album.description = description || album.description;
  album.isExplicit =
    isExplicit !== undefined ? isExplicit === "true" : album.isExplicit;

  if (req.file) {
    const result = await uploadToCloudinary(req.file.path, "dotify/albums");
    album.coverImage = result.secure_url;
  }

  //  Save updated artist details
  const updatedAlbum = await album.save();
  res.status(StatusCodes.OK).json(updatedAlbum);
});

// @desc - Delete album
// @route - DELETE /api/albums/:id
// @Access - Private/Admin
const deleteAlbum = asyncHandler(async (req, res) => {
  const album = await Album.findById(req.params.id);

  if (!album) {
    res.status(StatusCodes.NOT_FOUND);
    throw new Error("Album not found");
  }

  //   Remove album from artist's albums
  await Artist.updateOne(
    {
      _id: album.artist,
    },
    {
      $pull: { albums: album._id },
    }
  );

  //   Update songs to remove album reference
  await Song.updateMany({ album: album._id }, { $unset: { album: 1 } });

  await album.deleteOne();
  res.status(StatusCodes.OK).json({
    message: "Album removed",
  });
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

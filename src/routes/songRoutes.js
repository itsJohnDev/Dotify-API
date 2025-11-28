const express = require("express");
const { protect, isAdmin } = require("../../middleware/auth");
const {
  createSong,
  getSongs,
  getSongById,
  updateSong,
  deleteSong,
  getTopSongs,
  getNewReleases,
} = require("../controllers/songController");
const upload = require("../../middleware/upload");

const songRouter = express.Router();

// Configure multer to handle multiple file types
const songUpload = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

// Public
songRouter.get("/", getSongs);
songRouter.get("/new-releases", getNewReleases);
songRouter.get("/:id", getSongById);
songRouter.get("/top", getTopSongs);

// Private
songRouter.post("/", protect, isAdmin, songUpload, createSong);
songRouter.put("/:id", protect, isAdmin, songUpload, updateSong);
songRouter.delete("/:id", protect, isAdmin, deleteSong);

module.exports = songRouter;

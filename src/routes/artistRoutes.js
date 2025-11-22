const express = require("express");
const { protect, isAdmin } = require("../../middleware/auth");
const upload = require("../../middleware/upload");
const {
  createArtists,
  getArtists,
  getArtistById,
  updateArtist,
  deleteArtist,
  getTopArtists,
  getArtistTopSongs,
} = require("../controllers/artistController");

const artistRouter = express.Router();

// Public routes
artistRouter.get("/", getArtists);
artistRouter.get("/top", getTopArtists);
artistRouter.get("/:id", getArtistById);
artistRouter.get("/:id/top-songs", getArtistTopSongs);

// Admin
artistRouter.post("/", protect, isAdmin, upload.single("image"), createArtists);
artistRouter.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("image"),
  updateArtist
);
artistRouter.delete("/:id", protect, isAdmin, deleteArtist);

module.exports = artistRouter;

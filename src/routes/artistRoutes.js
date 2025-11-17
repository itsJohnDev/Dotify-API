const express = require("express");
const { protect, isAdmin } = require("../../middleware/auth");
const upload = require("../../middleware/upload");
const {
  createArtists,
  getArtists,
  getArtistById,
} = require("../controllers/artistController");

const artistRouter = express.Router();

// Public routes
artistRouter.get("/", getArtists);
artistRouter.get("/:id", getArtistById);

// Admin
artistRouter.post("/", protect, isAdmin, upload.single("image"), createArtists);

module.exports = artistRouter;

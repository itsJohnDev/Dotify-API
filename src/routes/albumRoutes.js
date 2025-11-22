const express = require("express");
const { protect, isAdmin } = require("../../middleware/auth");
const {
  createAlbum,
  getAllAlbums,
  getNewReleases,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongsToALbum,
  removeSongsFromAlbum,
} = require("../controllers/albumController");
const upload = require("../../middleware/upload");

const albumRouter = express.Router();

// Public
albumRouter.get("/", getAllAlbums);
albumRouter.get("/new-releases", getNewReleases);
albumRouter.get("/:id", getAlbumById);

// Private
albumRouter.post(
  "/",
  protect,
  isAdmin,
  upload.single("coverImage"),
  createAlbum
);
albumRouter.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("coverImage"),
  updateAlbum
);
albumRouter.delete("/:id", protect, isAdmin, deleteAlbum);
albumRouter.put("/:id/add-songs", protect, isAdmin, addSongsToALbum);
albumRouter.delete(
  "/:id/remove-songs/:songId",
  protect,
  isAdmin,
  removeSongsFromAlbum
);

module.exports = albumRouter;

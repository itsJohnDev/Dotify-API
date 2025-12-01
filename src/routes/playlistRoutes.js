const express = require("express");
const { protect, isAdmin } = require("../../middleware/auth");
const upload = require("../../middleware/upload");
const {
  createPlaylist,
  getPlaylists,
  getFeaturedPlaylists,
  getPlaylistById,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSongsToPlaylist,
  removeSongFromPlaylist,
  removeCollaborator,
  addCollaborator,
} = require("../controllers/playlistController");

const playlistRouter = express.Router();

// Public
playlistRouter.get("/", getPlaylists);
playlistRouter.get("/featured", getFeaturedPlaylists);
playlistRouter.get("/:id", getPlaylistById);

// Private
playlistRouter.post("/", protect, upload.single("coverImage"), createPlaylist);
playlistRouter.get("/user/me", protect, getUserPlaylists);
playlistRouter.put(
  "/:id",
  protect,
  upload.single("coverImage"),
  updatePlaylist
);
playlistRouter.delete("/:id", protect, deletePlaylist);
playlistRouter.put("/:id/add-songs", protect, addSongsToPlaylist);
playlistRouter.put(
  "/:id/remove-playlist/:songId",
  protect,
  removeSongFromPlaylist
);
playlistRouter.put("/:id/add-collaborator", protect, addCollaborator);
playlistRouter.put("/:id/remove-collaborator", protect, removeCollaborator);

module.exports = playlistRouter;

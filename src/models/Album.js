const mongoose = require("mongoose");

// Schema
const albumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Album title is required"],
      trim: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Artist is required"],
      ref: "Artist",
    },
    releasedDate: {
      type: Date,
      default: Date.now(),
    },
    coverImage: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2013/07/13/10/32/audio-157431_1280.png",
    },

    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    genre: {
      type: String,
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    isExplicit: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compile to for the model
const Album = mongoose.model("Album", albumSchema);

module.exports = Album;

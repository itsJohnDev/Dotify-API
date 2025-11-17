const mongoose = require("mongoose");

// Schema
const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Artist name is required"],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    releasedDate: {
      type: Date,
      default: Date.now(),
    },
    genres: [
      {
        type: String,
        trim: true,
      },
    ],
    followers: {
      type: Number,
      default: 0,
    },
    albums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album",
      },
    ],
    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

artistSchema.pre("save", function (next) {
  if (!this.image) {
    this.image =
      "https://cdn.pixabay.com/photo/2015/04/29/09/33/drums-745077_1280.jpg";
  }
  next();
});

// Compile to for the model
const Artist = mongoose.model("Artist", artistSchema);

module.exports = Artist;

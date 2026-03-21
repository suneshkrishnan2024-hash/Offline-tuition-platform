const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
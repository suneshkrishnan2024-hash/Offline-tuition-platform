const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    monthlyFee: { type: Number, required: true },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    pendingStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 🔥 ADD THIS
    documents: [
      {
        fileUrl: String,
        fileName: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
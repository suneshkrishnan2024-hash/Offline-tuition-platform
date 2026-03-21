const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Marks = require("../models/Marks");
const Class = require("../models/Class");

const router = express.Router();

// Upload marks (teacher only)
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload marks" });
    }

    const { studentId, classId, testName, marksObtained, totalMarks } = req.body;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 🔐 Only class teacher can upload
    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const newMarks = await Marks.create({
      student: studentId,
      class: classId,
      testName,
      marksObtained,
      totalMarks,
    });

    res.status(201).json({
      message: "Marks uploaded",
      marks: newMarks,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    // Only students
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view marks" });
    }

    const marks = await Marks.find({
      student: req.user.id,
    }).populate("class", "title subject");

    res.json({
      message: "Marks fetched",
      marks,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
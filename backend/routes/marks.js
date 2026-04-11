const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Marks = require("../models/Marks");
const Class = require("../models/Class");

const router = express.Router();


// ================== UPLOAD MARKS ==================
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

    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const newMarks = await Marks.create({
      student: studentId,
      class: classId, // ✅ FIXED
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


// ================== STUDENT MARKS ==================
router.get("/my", authMiddleware, async (req, res) => {
  try {
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


// ================== CLASS-WISE MARKS ==================
router.get("/class/:classId", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;

    // 🔥 GET ALL MARKS OF STUDENT
    const allMarks = await Marks.find({
      student: req.user.id,
    });

    // 🔥 FILTER IN BACKEND (SAFE)
    const filtered = allMarks.filter(
      (m) => m.class.toString() === classId
    );

    res.json({ marks: filtered });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching marks" });
  }
});


module.exports = router;
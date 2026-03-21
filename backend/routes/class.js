const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Class = require("../models/Class");

const router = express.Router();

router.post("/create", authMiddleware, async (req, res) => {
  try {
    // Only teacher can create
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create classes" });
    }

    const { title, subject, monthlyFee } = req.body;

    const newClass = await Class.create({
      title,
      subject,
      monthlyFee,
      teacher: req.user.id, // 🔥 from JWT
    });

    res.status(201).json({
      message: "Class created successfully",
      class: newClass,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/join/:classId", authMiddleware, async (req, res) => {
  try {
    // 🔐 Only students allowed
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can join classes" });
    }

    const { classId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 🚫 Prevent duplicate join
    if (
      foundClass.students.includes(req.user.id) ||
      foundClass.pendingStudents.includes(req.user.id)
    ) {
      return res.status(400).json({ message: "Already requested or enrolled" });
    }

    // ➕ Add to pending list
    foundClass.pendingStudents.push(req.user.id);
    await foundClass.save();

    res.json({
      message: "Join request sent",
      class: foundClass,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/approve/:classId/:studentId", authMiddleware, async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 🔐 Only teacher who owns the class
    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Move student from pending → students
    foundClass.pendingStudents = foundClass.pendingStudents.filter(
      (id) => id.toString() !== studentId
    );

    foundClass.students.push(studentId);

    await foundClass.save();

    res.json({
      message: "Student approved",
      class: foundClass,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
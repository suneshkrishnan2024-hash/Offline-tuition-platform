const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Announcement = require("../models/Announcement");
const Class = require("../models/Class");

const router = express.Router();

// 📢 Create announcement (teacher only)
router.post("/create", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create announcements" });
    }

    const { classId, message } = req.body;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 🔐 Only class teacher
    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const newAnnouncement = await Announcement.create({
      message,
      class: classId,
      teacher: req.user.id,
    });

    res.status(201).json({
      message: "Announcement created",
      announcement: newAnnouncement,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 📢 Get announcements for a class (students + teacher)
router.get("/:classId", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;

    const announcements = await Announcement.find({ class: classId })
      .sort({ createdAt: -1 });

    res.json({
      message: "Announcements fetched",
      announcements,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Event = require("../models/Event");
const Class = require("../models/Class");

const router = express.Router();

// ➕ Create event (teacher only)
router.post("/create", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create events" });
    }

    const { title, type, date, classId } = req.body;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 🔐 Only class teacher
    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const newEvent = await Event.create({
      title,
      type,
      date,
      class: classId,
      teacher: req.user.id,
    });

    res.status(201).json({
      message: "Event created",
      event: newEvent,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 📅 Get events for class
router.get("/:classId", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;

    const events = await Event.find({ class: classId })
      .sort({ date: 1 });

    res.json({
      message: "Events fetched",
      events,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
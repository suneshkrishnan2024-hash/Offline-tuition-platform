const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Marks = require("../models/Marks");
const Class = require("../models/Class");

const router = express.Router();


// 📊 Student performance (KEEP THIS FIRST to avoid route conflict)
router.get("/my-performance", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can view performance" });
    }

    const marks = await Marks.find({ student: req.user.id }).sort({ createdAt: 1 });

    if (marks.length === 0) {
      return res.json({
        message: "No marks available",
        average: 0,
        trend: "no data",
        comparedToClass: "no data",
      });
    }

    // 📊 Average
    let total = 0;
    marks.forEach((m) => (total += m.marksObtained));
    const average = total / marks.length;

    // 📈 Trend
    const first = marks[0].marksObtained;
    const last = marks[marks.length - 1].marksObtained;

    let trend = "stable";
    if (last > first) trend = "improving";
    else if (last < first) trend = "declining";

    // 📊 Compare with class
    let comparedToClass = "unknown";

    const classId = marks[0].class;

    const classMarks = await Marks.find({ class: classId });

    let classTotal = 0;
    classMarks.forEach((m) => {
      classTotal += m.marksObtained;
    });

    const classAverage = classTotal / classMarks.length;

    if (average > classAverage) {
      comparedToClass = "above";
    } else if (average < classAverage) {
      comparedToClass = "below";
    } else {
      comparedToClass = "equal";
    }

    const marksHistory = marks.map((m) => ({
      test: m.testName,
      score: m.marksObtained,
      date: m.createdAt,
    }));

    res.json({
      message: "Performance fetched",
      average,
      trend,
      comparedToClass,
      marksHistory,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 📊 Class analytics
router.get("/class/:classId", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 🔐 Only teacher of class
    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const marks = await Marks.find({ class: classId });
    const marksHistory = marks.map((m) => ({
      test: m.testName,
      score: m.marksObtained,
    }));
    if (marks.length === 0) {
      return res.json({
        message: "No marks available",
        classAverage: 0,
        topperScore: 0,
        studentCount: 0,
        marksHistory: [],
      });
    }

    // 📊 Calculate values
    let total = 0;
    let topper = 0;

    marks.forEach((m) => {
      total += m.marksObtained;
      if (m.marksObtained > topper) {
        topper = m.marksObtained;
      }
    });

    const average = total / marks.length;

    // 🧠 Unique student count (correct version)
    const uniqueStudents = new Set(
      marks.map((m) => m.student.toString())
    );

    const studentCount = uniqueStudents.size;

    res.json({
      message: "Analytics fetched",
      classAverage: average,
      topperScore: topper,
      studentCount,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/class-graph/:classId", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 🔐 Only teacher (parent later)
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view class graph" });
    }

    const marks = await Marks.find({ class: classId }).sort({ createdAt: 1 });

    if (marks.length === 0) {
      return res.json({
        message: "No marks available",
        graphData: [],
      });
    }

    // 📊 Group by test name
    const testMap = {};

    marks.forEach((m) => {
      if (!testMap[m.testName]) {
        testMap[m.testName] = {
          total: 0,
          count: 0,
          date: m.createdAt,
        };
      }

      testMap[m.testName].total += m.marksObtained;
      testMap[m.testName].count += 1;
    });

    // 📈 Convert to graph format
    const graphData = Object.keys(testMap).map((test) => ({
      test,
      average: testMap[test].total / testMap[test].count,
      date: testMap[test].date.toISOString().split("T")[0],
    }));

    res.json({
      message: "Class graph fetched",
      graphData,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
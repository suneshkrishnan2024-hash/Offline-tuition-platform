const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Class = require("../models/Class");
const QRCode = require("qrcode");
const multer = require("multer");

const router = express.Router();


// ================= FILE STORAGE =================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


// 🏫 CREATE CLASS
router.post("/create", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create classes" });
    }

    const { title, subject, monthlyFee } = req.body;

    const newClass = await Class.create({
      title,
      subject,
      monthlyFee,
      teacher: req.user.id,
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


// 🎓 JOIN CLASS
router.post("/join/:classId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can join classes" });
    }

    const { classId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // ✅ FIXED (IMPORTANT)
    const alreadyJoined = foundClass.students.some(
      (id) => id.toString() === req.user.id
    );

    const alreadyPending = foundClass.pendingStudents.some(
      (id) => id.toString() === req.user.id
    );

    if (alreadyJoined || alreadyPending) {
      return res.status(400).json({ message: "Already requested or enrolled" });
    }

    foundClass.pendingStudents.push(req.user.id);
    await foundClass.save();

    res.json({ message: "Join request sent" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ APPROVE STUDENT
router.post("/approve/:classId/:studentId", authMiddleware, async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // remove from pending
    foundClass.pendingStudents = foundClass.pendingStudents.filter(
      (id) => id.toString() !== studentId
    );

    // add only if not already present
    if (!foundClass.students.some(id => id.toString() === studentId)) {
      foundClass.students.push(studentId);
    }

    await foundClass.save();

    res.json({ message: "Student approved" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 📱 QR CODE
router.get("/qr/:classId", authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const joinURL = `${process.env.BASE_URL}/api/class/join/${classId}`;
    const qrCode = await QRCode.toDataURL(joinURL);

    res.json({
      qr: qrCode,
      url: joinURL,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 📚 MY CLASSES
router.get("/my", authMiddleware, async (req, res) => {
  try {
    let classes;

    if (req.user.role === "student") {
      classes = await Class.find({
        students: req.user.id,
      }).populate("teacher", "name email");

    } else if (req.user.role === "teacher") {
      classes = await Class.find({
        teacher: req.user.id,
      });
    }

    res.json({ classes });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 🎓 ALL CLASSES
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find().populate("teacher", "name");

    res.json({ classes });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 📄 CLASS DETAILS (IMPORTANT FIX)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate("students", "name email")
      .populate("pendingStudents", "name email");

    res.json({
      class: classData,
      students: classData.students,
      pendingStudents: classData.pendingStudents,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// 📁 UPLOAD DOCUMENT
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { classId } = req.body;

    const foundClass = await Class.findById(classId);

    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (foundClass.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    foundClass.documents.push({
      fileUrl: req.file.path,
      fileName: req.file.originalname,
    });

    await foundClass.save();

    res.json({ message: "File uploaded successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
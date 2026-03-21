require("dotenv").config();

const authMiddleware = require("./middleware/authMiddleware");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const classRoutes = require("./routes/class");
const marksRoutes = require("./routes/marks");

const app = express();

app.use(express.json());
app.use("/api/marks", marksRoutes);
app.use("/api/class", classRoutes);
// Connect routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
  })
  .catch((err) => {
    console.error("MongoDB connection failed ❌");
    console.error(err);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
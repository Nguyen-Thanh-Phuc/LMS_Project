import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import lessonsRoutes from "./routes/lessons.routes.js";
import enrollmentsRoutes from "./routes/enrollments.routes.js";
import quizzesRoutes from "./routes/quizzes.routes.js";
import attemptsRoutes from "./routes/attempts.routes.js";
import certificatesRoutes from "./routes/certificates.routes.js";
import usersRoutes from "./routes/users.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
// Allow populating fields added to schemas without restarting during development
mongoose.set("strictPopulate", false);

connectDB();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/lessons", lessonsRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/attempts", attemptsRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

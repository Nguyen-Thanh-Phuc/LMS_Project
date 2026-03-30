import express from "express";
import {
  enrollCourse,
  getEnrollmentsByUser,
  getMyEnrollmentHistory,
  getEnrollmentsByCourse,
  updateEnrollmentProgress,
  markLessonComplete,
  unenrollCourse,
  getEnrollmentStats
} from "../controllers/enrollments.controller.js";

import {
  validateEnrollCourse,
  validateUpdateEnrollmentProgress,
  validatePagination
} from "../middleware/validationMiddleware.js";

import { protect } from "../middleware/authMiddleware.js";
import Enrollment from "../models/enrollment.model.js"; 
import Lesson from "../models/lesson.model.js";
import Quiz from "../models/quiz.model.js";

const router = express.Router();

// ==============================
// Admin Stats
// ==============================
router.get("/stats/overview", protect, getEnrollmentStats);

// ==============================
// Enroll in course
// ==============================
router.post("/", protect, validateEnrollCourse, enrollCourse);

// ==============================
// Get current user's enrollments
// Existing route: /api/enrollments/my
// ==============================
router.get("/my", protect, getEnrollmentsByUser);

// ==============================
// Get current user's enrollment history + certificates
// ==============================
router.get("/my/history", protect, getMyEnrollmentHistory);

// ==============================
// Alias route for my-enrollments (used by frontend)
// ==============================
router.get("/my-enrollments", protect, getEnrollmentsByUser);

// ==============================
// NEW: Get current user's enrolled COURSES only
// Route: /api/enrollments/my-courses
// ==============================
router.get("/my-courses", protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ userId: req.user._id })
      .populate("courseId");

    const courses = enrollments.map(e => e.courseId);

    // Fetch lessons and quizzes for each course
    const coursesWithContent = await Promise.all(
      courses.map(async (course) => {
        const lessons = await Lesson.find({ courseId: course._id });
        const quizzes = await Quiz.find({ courseId: course._id });
        
        return {
          ...course.toObject(),
          lessons,
          quizzes
        };
      })
    );

    res.json({ data: coursesWithContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// Get enrollments by course (admin)
// ==============================
router.get(
  "/course/:courseId",
  protect,
  validatePagination,
  getEnrollmentsByCourse
);

// ==============================
// Update progress
// ==============================
router.put(
  "/:enrollmentId/progress",
  protect,
  validateUpdateEnrollmentProgress,
  updateEnrollmentProgress
);

// ==============================
// Mark lesson complete (Toggle Bật/Tắt)
// Đã đổi từ :enrollmentId sang course/:courseId để Frontend dễ gọi API
// ==============================
router.put(
  "/course/:courseId/lesson/:lessonId/complete",
  protect,
  markLessonComplete
);

// ==============================
// Unenroll
// ==============================
router.delete("/:enrollmentId", protect, unenrollCourse);

export default router;
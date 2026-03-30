import express from "express";
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  getQuizzesByCourse,
  createQuizWithQuestions,
  submitQuiz,
  getInstructorQuizBank,
  importQuizFromBank,
} from "../controllers/quizzes.controller.js";

import {
  validateCreateQuiz,
  validateUpdateQuiz,
  validateAddQuestion,
  validatePagination,
} from "../middleware/validationMiddleware.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   STUDENT ROUTES (ALL PROTECTED)
===================================================== */

// Get quizzes by course (student view)
router.get("/course/:courseId", protect, getQuizzesByCourse);

// Get single quiz
router.get("/:quizId", protect, getQuizById);

// Submit quiz (auto grading)
router.post("/:quizId/submit", protect, submitQuiz);

/* =====================================================
   INSTRUCTOR ROUTES (PROTECTED)
===================================================== */

// Create quiz with questions
router.post("/with-questions", protect, createQuizWithQuestions);

// Quiz Bank
router.get("/instructor/quiz-bank", protect, getInstructorQuizBank);
router.post("/import-from-bank", protect, importQuizFromBank);

/* =====================================================
   ADMIN / CRUD ROUTES (PROTECTED)
===================================================== */

// Get all quizzes (pagination)
router.get("/", protect, validatePagination, getQuizzes);

// Create quiz (basic)
router.post("/", protect, validateCreateQuiz, createQuiz);

// Update quiz
router.put("/:quizId", protect, validateUpdateQuiz, updateQuiz);

// Delete quiz
router.delete("/:quizId", protect, deleteQuiz);

// Add question manually
router.post(
  "/:quizId/questions",
  protect,
  validateAddQuestion,
  addQuestion
);

export default router;
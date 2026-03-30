import express from "express";
import {
  submitQuizAttempt,
  getUserAttempts,
  getQuizAttempts,
  getAttemptById,
  getBestAttempt,
  getQuizStats,
  deleteAttempt,
  getMyAttemptForQuiz,
  getMyAttemptsByCourse,
  getMyAttemptHistory   
} from "../controllers/attempts.controller.js";

import {
  validateSubmitAttempt,
  validatePagination
} from "../middleware/validationMiddleware.js";

import { protect } from "../middleware/authMiddleware.js"; 

const router = express.Router();


// =============================
// Submit quiz attempt
// =============================
router.post(
  "/",
  protect,
  validateSubmitAttempt,
  submitQuizAttempt
);


// =============================
// Current logged-in user routes
// =============================
router.get(
  "/my/history",
  protect,
  getMyAttemptHistory
);

router.get(
  "/my/:quizId",
  protect,
  getMyAttemptForQuiz
);


// =============================
// Specific routes (before general ones)
// =============================
router.get(
  "/user/:userId/quiz/:quizId/best",
  protect,
  getBestAttempt
);

router.get(
  "/quiz/:quizId/stats",
  protect,
  getQuizStats
);


// =============================
// General routes
// =============================
router.get(
  "/user/:userId",
  protect,
  validatePagination,
  getUserAttempts
);

router.get(
  "/quiz/:quizId",
  protect,
  validatePagination,
  getQuizAttempts
);

router.get(
  "/:attemptId",
  protect,
  getAttemptById
);
router.get("/my/course/:courseId", protect, getMyAttemptsByCourse);

// =============================
// Admin route
// =============================
router.delete(
  "/:attemptId",
  protect,
  deleteAttempt
);


export default router;
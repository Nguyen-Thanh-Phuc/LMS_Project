import express from "express";
import {
  getDashboardOverview,
  getDashboardAnalytics,
  getAllCoursesAdmin,
  getAllStudentsAdmin,
  getAllEnrollmentsAdmin,
  getAllQuizzesAdmin,
  getAllAttemptsAdmin,
  getAllCertificatesAdmin,
  getCourseDetailedStats,
  getStudentDetailedStats,
  banStudent,
  unbanStudent
} from "../controllers/admin.controller.js";
import { validatePagination } from "../middleware/validationMiddleware.js";

// THÊM DÒNG NÀY: Import 2 lớp khiên bảo vệ
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// BẮT BUỘC: Áp dụng protect và admin cho TẤT CẢ các route bên dưới
// Cách viết này sẽ áp dụng khiên cho toàn bộ router, bạn không cần phải gõ lại từng dòng nữa!
router.use(protect, admin);

// ===== DASHBOARD =====
router.get("/dashboard/overview", getDashboardOverview);
router.get("/dashboard/analytics", getDashboardAnalytics);

// ===== COURSE MANAGEMENT =====
// Do đã dùng router.use() ở trên, các route này tự động có req.user
router.get("/courses", validatePagination, getAllCoursesAdmin);
router.get("/courses/:courseId/stats", getCourseDetailedStats);

// ===== STUDENT MANAGEMENT =====
router.get("/students", validatePagination, getAllStudentsAdmin);
router.get("/students/:studentId/stats", getStudentDetailedStats);
router.post("/students/:studentId/ban", banStudent);
router.post("/students/:studentId/unban", unbanStudent);

// ===== ENROLLMENT MANAGEMENT =====
router.get("/enrollments", getAllEnrollmentsAdmin);

// ===== QUIZ MANAGEMENT =====
router.get("/quizzes", validatePagination, getAllQuizzesAdmin);

// ===== ATTEMPT MANAGEMENT =====
router.get("/attempts", validatePagination, getAllAttemptsAdmin);

// ===== CERTIFICATE MANAGEMENT =====
router.get("/certificates", validatePagination, getAllCertificatesAdmin);

export default router;
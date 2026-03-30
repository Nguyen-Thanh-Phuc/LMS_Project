import express from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseStats
} from "../controllers/courses.controller.js";
import { 
  validateCreateCourse, 
  validateUpdateCourse, 
  validatePagination 
} from "../middleware/validationMiddleware.js";

// 1. Nhập ống nước Cloudinary vào
import upload from "../config/cloudinary.js";

// 2. Nhập khiên bảo vệ (Auth Middleware) vào
import { protect, optionalProtect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin stats (Chỉ Admin mới được xem thống kê)
router.get("/stats/overview", protect, admin, getCourseStats);

// Public routes (Ai cũng xem được danh sách và chi tiết khóa học)
router.get("/", optionalProtect, validatePagination, getCourses);
router.get("/:courseId", optionalProtect, getCourseById);

// 3. Admin routes (Bắt buộc phải lọt qua khiên protect và admin trước)
router.post("/", protect, admin, upload.single("thumbnail"), validateCreateCourse, createCourse);
router.put("/:courseId", protect, admin, upload.single("thumbnail"), validateUpdateCourse, updateCourse);
router.delete("/:courseId", protect, admin, deleteCourse);

export default router;
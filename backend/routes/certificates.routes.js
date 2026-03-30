import express from "express";
import {
  generateCertificate,
  getUserCertificates,
  getCertificateById,
  getCourseCertificates,
  verifyCertificate,
  downloadCertificate,
  getCertificateStats,
  getMyCertificateForCourse
} from "../controllers/certificates.controller.js";
import { 
  validateGenerateCertificate, 
  validatePagination 
} from "../middleware/validationMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin stats (specific route before wildcard)
router.get("/stats/overview", getCertificateStats);

// Specific routes before wildcards
router.get("/verify/:certificateId", verifyCertificate);
router.get("/:certificateId/download", protect, downloadCertificate);
router.get("/my/course/:courseId", protect, getMyCertificateForCourse);
router.get("/user/:userId", validatePagination, getUserCertificates);
router.get("/course/:courseId", validatePagination, getCourseCertificates);
router.get("/:certificateId", getCertificateById);

// Generate certificate (user)
router.post("/", protect, validateGenerateCertificate, generateCertificate);

// (revocation removed from API)
export default router;

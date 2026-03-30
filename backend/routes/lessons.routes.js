import express from "express";

import {

  createLesson,

  getLessonsByCourse,

  getLessonById,

  updateLesson,

  deleteLesson,

  getAllLessons

} from "../controllers/lessons.controller.js";



import { protect, admin } from "../middleware/authMiddleware.js";



import { uploadDoc } from "../config/cloudinary.js";



const router = express.Router();





router.get("/course/:courseId", getLessonsByCourse);

router.get("/:lessonId", protect, getLessonById);





router.get("/", protect, admin, getAllLessons);



router.post("/", protect, admin, uploadDoc.single("pdfUrl"), createLesson);

router.put("/:lessonId", protect, admin, uploadDoc.single("pdfUrl"), updateLesson);

router.delete("/:lessonId", protect, admin, deleteLesson);



export default router;
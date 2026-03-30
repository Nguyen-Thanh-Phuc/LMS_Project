import Lesson from "../models/lesson.model.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import { ApiError } from "../middleware/errorHandler.js";
import { v2 as cloudinary } from "cloudinary";


// Create a new lesson (Hỗ trợ upload PDF)
export const createLesson = async (req, res, next) => {
  try {
    const { courseId, title, videoUrl, content, order } = req.body;

    if (!courseId || !title ) {
      return next(new ApiError(400, "CourseId, title are required"));
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError(404, "Course not found"));
    }

    let pdfUrl = "";
    if (req.file) {
      pdfUrl = req.file.path;
    }

    const lesson = await Lesson.create({
      courseId,
      title,
      videoUrl,
      content,
      pdfUrl,
      order: order || 0
    });

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      data: lesson
    });

  } catch (error) {
    next(error);
  }
};


// Get all lessons for a course
export const getLessonsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { sort = "order" } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError(404, "Course not found"));
    }

    const lessons = await Lesson.find({ courseId }).sort(sort);

    res.status(200).json({
      success: true,
      data: lessons,
      count: lessons.length
    });

  } catch (error) {
    next(error);
  }
};


// Get single lesson by ID
export const getLessonById = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user._id;

    const lesson = await Lesson.findById(lessonId)
      .populate("courseId", "title description");

    if (!lesson) {
      return next(new ApiError(404, "Lesson not found"));
    }

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      userId: userId,
      courseId: lesson.courseId._id
    });

    if (!enrollment) {
      return next(new ApiError(403, "You are not enrolled in this course"));
    }

    res.status(200).json({
      success: true,
      data: lesson
    });

  } catch (error) {
    next(error);
  }
};


// Update lesson (Hỗ trợ đổi file PDF và dọn rác)
export const updateLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { title, videoUrl, content, order } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return next(new ApiError(404, "Lesson not found"));
    }

    let updateData = { title, videoUrl, content, order };

    if (req.file) {
      updateData.pdfUrl = req.file.path;

      if (lesson.pdfUrl && lesson.pdfUrl.includes("cloudinary.com")) {
        const urlParts = lesson.pdfUrl.split("/");
        const publicIdWithExtension = urlParts.slice(-2).join("/");
        const publicId = publicIdWithExtension.split(".")[0];

        await cloudinary.uploader.destroy(publicId);
      }
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: updatedLesson
    });

  } catch (error) {
    next(error);
  }
};


// Delete lesson (Hỗ trợ xóa tận gốc file PDF)
export const deleteLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return next(new ApiError(404, "Lesson not found"));
    }

    if (lesson.pdfUrl && lesson.pdfUrl.includes("cloudinary.com")) {
      const urlParts = lesson.pdfUrl.split("/");
      const publicIdWithExtension = urlParts.slice(-2).join("/");
      const publicId = publicIdWithExtension.split(".")[0];

      await cloudinary.uploader.destroy(publicId);
    }

    await lesson.deleteOne();

    res.status(200).json({
      success: true,
      message: "Lesson and attached files deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};


// Get all lessons (admin view)
export const getAllLessons = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

    let filter = {};
    if (search) {
      filter = { title: { $regex: search, $options: "i" } };
    }

    const skip = (page - 1) * limit;

    const lessons = await Lesson.find(filter)
      .populate("courseId", "title")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Lesson.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: lessons,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};
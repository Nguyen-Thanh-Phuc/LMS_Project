import Course from "../models/course.model.js";
import Lesson from "../models/lesson.model.js";
import { ApiError } from "../middleware/errorHandler.js";
// THÊM DÒNG NÀY: Import thư viện Cloudinary để gọi lệnh xóa ảnh
import { v2 as cloudinary } from "cloudinary";

// Create a new course
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, price } = req.body;

    if (!title || !description) {
      return next(new ApiError(400, "Title and description are required"));
    }

    let thumbnailUrl = "https://via.placeholder.com/300";
    if (req.file) {
      thumbnailUrl = req.file.path; 
    }

    const course = await Course.create({
      title,
      description,
      thumbnail: thumbnailUrl,
      price: price || 0,
      instructor: req.user._id // Tự động lấy từ Token
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// Get all courses with pagination, filtering, and sorting
export const getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ]
      };
    }

    const isAdminOrInstructor = req.user && (req.user.role === "admin" || req.user.role === "instructor");
    if (!isAdminOrInstructor) {
      filter = {
        ...filter,
        $or: [
          { isPublished: true },
          { isPublished: { $exists: false } }
        ]
      };
    }

    const skip = (page - 1) * limit;
    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: courses,
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

// Get single course by ID
export const getCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
      .populate("instructor", "name email")
      .populate("studentsEnrolled", "name email");

    if (!course) {
      return next(new ApiError(404, "Course not found"));
    }

    const isAdminOrInstructor = req.user && (req.user.role === "admin" || req.user.role === "instructor");
    const courseIsPublished = course.isPublished !== false; // legacy course with undefined = true

    if (!courseIsPublished && !isAdminOrInstructor) {
      return next(new ApiError(404, "Course not found"));
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

// Update course (ĐÃ THÊM TÍNH NĂNG DỌN RÁC ẢNH CŨ)
export const updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, price, isPublished } = req.body;

    // 1. Tìm khóa học cũ trước để lấy link ảnh
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError(404, "Course not found"));
    }

    let updateData = { title, description, price };
    if (typeof isPublished === "boolean") {
      updateData.isPublished = isPublished;
    }

    // 2. Nếu người dùng có upload ảnh MỚI
    if (req.file) {
      updateData.thumbnail = req.file.path;

      // XÓA ẢNH CŨ TRÊN CLOUDINARY (chỉ xóa nếu nó không phải ảnh placeholder)
      if (course.thumbnail && course.thumbnail.includes("cloudinary.com")) {
        // Cắt chuỗi để lấy thư mục và tên file: "LMS_Courses/xyz123"
        const urlParts = course.thumbnail.split("/");
        const publicIdWithExtension = urlParts.slice(-2).join("/"); 
        const publicId = publicIdWithExtension.split(".")[0]; 

        // Gửi lệnh tiêu diệt file trên Cloudinary
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // 3. Cập nhật dữ liệu mới vào Database
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse
    });
  } catch (error) {
    next(error);
  }
};

// Delete course (ĐÃ THÊM TÍNH NĂNG XÓA TẬN GỐC ẢNH)
export const deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // 1. Tìm khóa học để lấy thông tin ảnh trước khi xóa
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError(404, "Course not found"));
    }

    // 2. If students are enrolled, block deletion
    if (course.studentsEnrolled && course.studentsEnrolled.length > 0) {
      return next(new ApiError(400, "Cannot delete course with enrolled students"));
    }

    // 3. TÌM VÀ DIỆT ẢNH TRÊN CLOUDINARY
    if (course.thumbnail && course.thumbnail.includes("cloudinary.com")) {
      const urlParts = course.thumbnail.split("/");
      const publicIdWithExtension = urlParts.slice(-2).join("/"); 
      const publicId = publicIdWithExtension.split(".")[0]; 

      await cloudinary.uploader.destroy(publicId);
    }

    // 4. Xóa dữ liệu trong MongoDB
    await course.deleteOne();

    // 4. Xóa luôn các bài học (lessons) liên quan tới khóa này
    await Lesson.deleteMany({ courseId });

    res.status(200).json({
      success: true,
      message: "Course and its thumbnail deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get course statistics
export const getCourseStats = async (req, res, next) => {
  try {
    const totalCourses = await Course.countDocuments();
    const courses = await Course.find();

    let totalEnrollments = 0;
    courses.forEach(course => {
      totalEnrollments += course.studentsEnrolled?.length || 0;
    });

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        totalEnrollments,
        averageEnrollments: totalCourses > 0 ? (totalEnrollments / totalCourses).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};
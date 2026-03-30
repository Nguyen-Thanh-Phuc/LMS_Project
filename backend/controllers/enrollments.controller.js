import Enrollment from "../models/enrollment.model.js";
import Certificate from "../models/certificate.model.js";
import Course from "../models/course.model.js";
import { ApiError } from "../middleware/errorHandler.js";

// =====================================
// Enroll in Course
// =====================================
export const enrollCourse = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized"));
    }

    const { courseId } = req.body;

    if (!courseId) {
      return next(new ApiError(400, "CourseId is required"));
    }

    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ApiError(404, "Course not found"));
    }

    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId,
    });

    if (existingEnrollment) {
      return next(new ApiError(400, "You are already enrolled in this course"));
    }

    const enrollment = await Enrollment.create({
      userId,
      courseId,
      enrolledAt: new Date(),
      progress: {
        completedLessons: [],
        passedQuizzes: [],
        percentage: 0
    },
      isCompleted: false
    });

    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { studentsEnrolled: userId },
    });

    res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Get My Enrollments (STRICT FILTER)
// =====================================
export const getEnrollmentsByUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized"));
    }

    const userId = req.user._id;

    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title description thumbnail")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Get My Enrollment History + Certificates
// =====================================
export const getMyEnrollmentHistory = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized"));
    }

    const userId = req.user._id;

    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title description thumbnail")
      .sort({ createdAt: -1 });

    const courseIds = enrollments
      .map((e) => e.courseId?._id)
      .filter(Boolean);

    const certificates = await Certificate.find({
      userId,
      courseId: { $in: courseIds },
      status: "issued"
    }).lean();

    const certByCourse = new Map(
      certificates.map((cert) => [cert.courseId.toString(), cert])
    );

    const data = enrollments.map((enrollment) => {
      const courseId = enrollment.courseId?._id?.toString();
      const cert = courseId ? certByCourse.get(courseId) : null;

      return {
        ...enrollment.toObject(),
        certificate: cert
          ? {
              _id: cert._id,
              certificateId: cert.certificateId,
              issuedAt: cert.completionDate,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Get Enrollments By Course (Admin Only)
// =====================================
export const getEnrollmentsByCourse = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return next(new ApiError(403, "Admin access required"));
    }

    const { courseId } = req.params;

    const enrollments = await Enrollment.find({ courseId })
      .populate("userId", "name email");

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Update Progress (OWNER CHECK)
// =====================================
export const updateEnrollmentProgress = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized"));
    }

    const { enrollmentId } = req.params;
    const { progress } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return next(new ApiError(404, "Enrollment not found"));
    }

    // 🔥 Prevent updating someone else's enrollment
    if (enrollment.userId.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "Not allowed"));
    }

    if (progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, progress));
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Progress updated",
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Mark Lesson Complete (OWNER CHECK)
// =====================================
// =====================================
// Toggle Lesson Complete (OWNER CHECK)
// =====================================
export const markLessonComplete = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized"));
    }

    // Đổi enrollmentId thành courseId để Frontend dễ gọi API hơn
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    // Tìm Enrollment dựa vào userId và courseId
    const enrollment = await Enrollment.findOne({ userId, courseId });

    if (!enrollment) {
      return next(new ApiError(404, "Enrollment not found"));
    }

    // Kiểm tra xem mảng đã có lessonId này chưa (Nhớ gọi đúng đường dẫn progress.completedLessons)
    const completedArray = enrollment.progress.completedLessons || [];
    const isCompleted = completedArray.includes(lessonId);

    if (isCompleted) {
      // NẾU ĐÃ TICK -> RÚT TICK RA (Hủy hoàn thành)
      enrollment.progress.completedLessons = completedArray.filter(
        id => id.toString() !== lessonId.toString()
      );
    } else {
      // NẾU CHƯA TICK -> ĐÁNH DẤU HOÀN THÀNH
      enrollment.progress.completedLessons.push(lessonId);
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: isCompleted ? "Lesson marked as incomplete" : "Lesson marked complete",
      isCompleted: !isCompleted, // Trả về trạng thái hiện tại để Frontend đổi màu nút ✅
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};
// =====================================
// Unenroll (OWNER CHECK)
// =====================================
export const unenrollCourse = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized"));
    }

    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return next(new ApiError(404, "Enrollment not found"));
    }

    if (enrollment.userId.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, "Not allowed"));
    }

    await Enrollment.findByIdAndDelete(enrollmentId);

    await Course.findByIdAndUpdate(enrollment.courseId, {
      $pull: { studentsEnrolled: enrollment.userId },
    });

    res.status(200).json({
      success: true,
      message: "Unenrolled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Enrollment Stats (Admin Only)
// =====================================
export const getEnrollmentStats = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return next(new ApiError(403, "Admin access required"));
    }

    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({
      progress: 100,
    });

    const completionRate =
      totalEnrollments > 0
        ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEnrollments,
        completedEnrollments,
        completionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
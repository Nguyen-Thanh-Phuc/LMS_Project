import User from "../models/user.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Attempt from "../models/attempt.model.js";
import Certificate from "../models/certificate.model.js";
import Lesson from "../models/lesson.model.js";
import Quiz from "../models/quiz.model.js";
import { ApiError } from "../middleware/errorHandler.js";

const getInstructorCourseIds = async (userId) => {
  return await Course.find({ instructor: userId }).distinct("_id");
};

const getInstructorStudentIds = async (userId) => {
  const courseIds = await getInstructorCourseIds(userId);
  if (!courseIds.length) return [];
  return await Enrollment.find({ courseId: { $in: courseIds } }).distinct("userId");
};

// ===== DASHBOARD OVERVIEW =====
export const getDashboardOverview = async (req, res, next) => {
  try {
    const courseIds = await getInstructorCourseIds(req.user._id);

    const totalCourses = await Course.countDocuments({ instructor: req.user._id });
    const totalLessons = await Lesson.countDocuments({ courseId: { $in: courseIds } });
    const totalQuizzes = await Quiz.countDocuments({ courseId: { $in: courseIds } });

    const totalEnrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds } });
    const completedEnrollments = await Enrollment.countDocuments({ courseId: { $in: courseIds }, "progress.percentage": 100 });

    const totalAttempts = await Attempt.countDocuments({ courseId: { $in: courseIds } });
    const passedAttempts = await Attempt.countDocuments({ courseId: { $in: courseIds }, passed: true });

    const totalCertificates = await Certificate.countDocuments({ courseId: { $in: courseIds }, status: "issued" });
    const revokedCertificates = await Certificate.countDocuments({ courseId: { $in: courseIds }, status: "revoked" });

    const studentIds = await getInstructorStudentIds(req.user._id);
    const totalStudents = studentIds.length;
    const totalAdmins = 1;

    const enrollmentCompletionRate = totalEnrollments > 0 
      ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2)
      : 0;

    const quizPassRate = totalAttempts > 0
      ? ((passedAttempts / totalAttempts) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalStudents,
          students: totalStudents,
          admins: totalAdmins
        },
        content: {
          courses: totalCourses,
          lessons: totalLessons,
          quizzes: totalQuizzes
        },
        enrollments: {
          total: totalEnrollments,
          completed: completedEnrollments,
          completionRate: enrollmentCompletionRate
        },
        quizzes: {
          totalAttempts,
          passed: passedAttempts,
          passRate: quizPassRate
        },
        certificates: {
          issued: totalCertificates,
          revoked: revokedCertificates
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== DASHBOARD ANALYTICS =====
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const courseIds = await getInstructorCourseIds(req.user._id);

    // Most popular courses by enrollment
    const popularCourses = await Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: "$courseId",
          enrollmentCount: { $sum: 1 }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course"
        }
      }
    ]);

    // Recent enrollments
    const recentEnrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ enrolledAt: -1 })
      .limit(10);

    // Quiz performance by course
    const quizPerformance = await Attempt.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: "$courseId",
          avgScore: { $avg: "$percentage" },
          totalAttempts: { $sum: 1 },
          passedCount: {
            $sum: { $cond: ["$passed", 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "course"
        }
      }
    ]);

    const studentIds = await getInstructorStudentIds(req.user._id);
    const activeUsers = await User.find({ _id: { $in: studentIds } })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        popularCourses,
        recentEnrollments,
        quizPerformance,
        activeUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== COURSE MANAGEMENT =====
export const getAllCoursesAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

    let filter = {
      instructor: req.user._id
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select("+studentsEnrolled");

    const total = await Course.countDocuments(filter);

    // Add enrollment count to each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id });
        const lessonCount = await Lesson.countDocuments({ courseId: course._id });
        const quizCount = await Quiz.countDocuments({ courseId: course._id });
        
        return {
          ...course.toObject(),
          stats: {
            enrollments: enrollmentCount,
            lessons: lessonCount,
            quizzes: quizCount
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: coursesWithStats,
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

// ===== STUDENT MANAGEMENT =====
export const getAllStudentsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

    const courseIds = await getInstructorCourseIds(req.user._id);
    const studentIds = await Enrollment.find({ courseId: { $in: courseIds } }).distinct("userId");

    let filter = {
      role: "user",
      _id: { $in: studentIds }
    };

    if (search) {
      filter = {
        ...filter,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      };
    }

    const skip = (page - 1) * limit;
    const students = await User.find(filter)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    // Add stats to each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.countDocuments({ userId: student._id });
        const completedCourses = await Enrollment.countDocuments({
          userId: student._id,
          $expr: { $gte: ["$progress.percentage", 100] }
        });
        const certificates = await Certificate.countDocuments({
          userId: student._id,
          status: "issued"
        });

        return {
          ...student.toObject(),
          stats: {
            enrollments,
            completedCourses,
            certificates
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: studentsWithStats,
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

// ===== ENROLLMENT MANAGEMENT =====
export const getAllEnrollmentsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-enrolledAt", courseId, userId } = req.query;

    const courseIds = await getInstructorCourseIds(req.user._id);
    let filter = { courseId: { $in: courseIds } };

    if (courseId) {
      if (!courseIds.some((id) => id.toString() === courseId.toString())) {
        return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), pages: 0 } });
      }
      filter.courseId = courseId;
    }
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;
    const enrollments = await Enrollment.find(filter)
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Enrollment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: enrollments,
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

// ===== QUIZ MANAGEMENT =====
export const getAllQuizzesAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", courseId, search } = req.query;
    const courseIds = await getInstructorCourseIds(req.user._id);

    let filter = {
      $or: [
        { createdBy: req.user._id },
        { courseId: { $in: courseIds } }
      ]
    };

    if (courseId) {
      if (courseId === 'bank') {
        // Special case: filter for bank quizzes only
        filter = {
          createdBy: req.user._id,
          isBank: true
        };
      } else {
        if (!courseIds.some((id) => id.toString() === courseId.toString())) {
          return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), pages: 0 } });
        }
        filter.courseId = courseId;
      }
    }
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const quizzes = await Quiz.find(filter)
      .populate("courseId", "title")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Quiz.countDocuments(filter);

    // Add stats and question count to each quiz
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = await Attempt.countDocuments({ quizId: quiz._id });
        const passedAttempts = await Attempt.countDocuments({
          quizId: quiz._id,
          passed: true
        });
        const avgScore = await Attempt.aggregate([
          { $match: { quizId: quiz._id } },
          { $group: { _id: null, avg: { $avg: "$percentage" } } }
        ]);

        return {
          ...quiz.toObject(),
          questionCount: quiz.questions?.length || 0,
          stats: {
            totalAttempts: attempts,
            passedAttempts,
            averageScore: (avgScore.length > 0 && avgScore[0].avg != null)
              ? Number(avgScore[0].avg).toFixed(2)
              : 0,
            passRate: attempts > 0 ? Number(((passedAttempts / attempts) * 100)).toFixed(2) : 0
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: quizzesWithStats,
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

// ===== QUIZ ATTEMPTS MANAGEMENT =====
export const getAllAttemptsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", quizId, userId, passed, courseId } = req.query;

    const courseIds = await getInstructorCourseIds(req.user._id);
    let filter = { courseId: { $in: courseIds } };

    if (quizId) filter.quizId = quizId;
    if (userId) filter.userId = userId;
    if (passed !== undefined) {
      // Handle both string and boolean values
      filter.passed = passed === "true" || passed === true;
    }
    if (courseId) {
      // Ensure the courseId is one of the instructor's courses
      if (!courseIds.some((id) => id.toString() === courseId.toString())) {
        return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), pages: 0 } });
      }
      filter.courseId = courseId;
    }

    const skip = (page - 1) * limit;
    const attempts = await Attempt.find(filter)
      .populate("userId", "name email")
      .populate("quizId", "title passingScore")
      .populate("courseId", "title")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Attempt.countDocuments(filter);

    // If no attempts found, return empty array instead of mock data
    if (total === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          pages: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: attempts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error in getAllAttemptsAdmin:", error);
    next(error);
  }
};

// ===== CERTIFICATE MANAGEMENT =====
export const getAllCertificatesAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-completionDate", courseId, userId, status } = req.query;

    const courseIds = await getInstructorCourseIds(req.user._id);
    let filter = { courseId: { $in: courseIds } };

    if (courseId) {
      if (!courseIds.some((id) => id.toString() === courseId.toString())) {
        return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: Number(page), limit: Number(limit), pages: 0 } });
      }
      filter.courseId = courseId;
    }
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const certificates = await Certificate.find(filter)
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Certificate.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: certificates,
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

// ===== DETAILED ANALYTICS =====
export const getCourseDetailedStats = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({ _id: courseId, instructor: req.user._id })
      .populate("instructor", "name email");

    if (!course) {
      return next(new ApiError(404, "Course not found or not owned by current admin"));
    }

    // Get detailed stats
    const enrollmentCount = await Enrollment.countDocuments({ courseId });
    const lessonCount = await Lesson.countDocuments({ courseId });
    const quizCount = await Quiz.countDocuments({ courseId });
    const certificateCount = await Certificate.countDocuments({ courseId, status: "issued" });

    // Enrollment progress
    const enrollmentProgress = await Enrollment.aggregate([
      { $match: { courseId: req.params.courseId } },
      {
        $group: {
          _id: null,
          avgProgress: { $avg: "$progress.percentage" },
          completed: {
            $sum: {
              $cond: [{ $gte: ["$progress.percentage", 100] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Quiz performance
    const quizStats = await Attempt.aggregate([
      { $match: { courseId: req.params.courseId } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: "$percentage" },
          passed: { $sum: { $cond: ["$passed", 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        course,
        stats: {
          enrollments: enrollmentCount,
          lessons: lessonCount,
          quizzes: quizCount,
          certificates: certificateCount,
          enrollmentProgress: enrollmentProgress[0] || { avgProgress: 0, completed: 0 },
          quizPerformance: quizStats[0] || { totalAttempts: 0, avgScore: 0, passed: 0 }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== STUDENT DETAILED STATS =====
export const getStudentDetailedStats = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select("-password");
    if (!student) {
      return next(new ApiError(404, "Student not found"));
    }

    const courseIds = await getInstructorCourseIds(req.user._id);

    // Enrollments
    const enrollments = await Enrollment.find({ userId: studentId, courseId: { $in: courseIds } })
      .populate("courseId", "title");

    // Certificates
    const certificates = await Certificate.find({ userId: studentId, status: "issued", courseId: { $in: courseIds } })
      .populate("courseId", "title");

    // Quiz attempts
    const attempts = await Attempt.find({ userId: studentId, courseId: { $in: courseIds } })
      .populate("quizId", "title")
      .populate("courseId", "title")
      .sort("-createdAt");

    // Summary
    const completedCourses = enrollments.filter(e => e.progress.percentage >= 100).length;
    const totalScore = attempts.reduce((sum, a) => sum + a.percentage, 0);
    const avgScore = attempts.length > 0 ? (totalScore / attempts.length).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        student,
        stats: {
          totalEnrollments: enrollments.length,
          completedCourses,
          totalAttempts: attempts.length,
          averageScore: avgScore,
          certificates: certificates.length
        },
        enrollments,
        certificates,
        recentAttempts: attempts.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BAN/UNBAN STUDENT
// ==========================================
export const banStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(studentId);
    if (!user) {
      return next(new ApiError(404, "Student not found"));
    }

    if (user.role === "admin") {
      return next(new ApiError(403, "Cannot ban admin users"));
    }

    user.banned = true;
    user.bannedReason = reason || "Account suspended by admin";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Student banned successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const unbanStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const user = await User.findById(studentId);
    if (!user) {
      return next(new ApiError(404, "Student not found"));
    }

    user.banned = false;
    user.bannedReason = "";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Student unbanned successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
};
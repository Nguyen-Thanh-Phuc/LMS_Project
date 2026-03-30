import User from "../models/user.js";
import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";
import { ApiError } from "../middleware/errorHandler.js";

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, sort = "-createdAt", search } = req.query;

    let filter = {};
    if (role) filter.role = role;
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
    const users = await User.find(filter)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
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

// Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password");

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Update user (admin can update others, users update themselves)
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Change user role (admin only)
export const changeUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin", "staff"].includes(role)) {
      return next(new ApiError(400, "Invalid role. Must be user, admin, or staff"));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // Remove user from all course enrollments
    await Enrollment.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get user learning statistics
export const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const enrollments = await Enrollment.find({ userId });
    const completedCourses = enrollments.filter(e => e.progress === 100).length;

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalEnrollments: enrollments.length,
        completedCourses,
        inProgressCourses: enrollments.length - completedCourses,
        completionRate: enrollments.length > 0 ? ((completedCourses / enrollments.length) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard statistics (admin only)
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "user" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    const completedEnrollments = await Enrollment.countDocuments({ progress: 100 });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalAdmins,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search users (admin)
export const searchUsers = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return next(new ApiError(400, "Search query is required"));
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
      .select("-password")
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  changeUserRole,
  deleteUser,
  getUserStats,
  getDashboardStats,
  searchUsers
} from "../controllers/users.controller.js";
import { 
  validateUpdateUser, 
  validateChangeUserRole, 
  validatePagination 
} from "../middleware/validationMiddleware.js";

const router = express.Router();

// Admin routes - specific before wildcard
router.get("/stats/dashboard", getDashboardStats);
router.get("/search", searchUsers);

// General routes
router.get("/", validatePagination, getAllUsers);
router.get("/:userId/stats", getUserStats);
router.get("/:userId", getUserById);

// Update operations
router.put("/:userId/role", validateChangeUserRole, changeUserRole);
router.put("/:userId", validateUpdateUser, updateUser);

// Delete user (admin only)
router.delete("/:userId", deleteUser);

export default router;

import express from "express";
import { register, login, refreshToken, logout, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { protect, admin } from "../middleware/authMiddleware.js";

import { 
  validateRegister, 
  validateLogin, 
  validateForgotPassword, 
  validateResetPassword 
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh-token", refreshToken); 
router.post("/logout", logout);              

router.get("/profile", protect, (req, res) => {
  res.json({ message: "Successfully login hidden!", user: req.user });
});
router.get("/admin-dashboard", protect, admin, (req, res) => {
  res.json({ message: "Welcome Boss!" });
});

router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.put("/reset-password/:resetToken", validateResetPassword, resetPassword);

export default router;
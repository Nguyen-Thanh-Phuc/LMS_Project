import User from "../models/user.js";
import RefreshToken from "../models/refreshToken.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// Helper tạo Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// --- 1. REGISTER ---
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 2. LOGIN ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({ 
        message: `Account has been suspended. Reason: ${user.bannedReason || "Account suspended by admin"}` 
      });
    }

    // Tạo Access Token
    const accessToken = generateAccessToken(user);

    // Tạo Refresh Token
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7); // 7 ngày

    const refreshTokenString = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE }
    );

    // Lưu Refresh Token vào DB
    await RefreshToken.create({
      token: refreshTokenString,
      user: user._id,
      expiryDate: expiredAt,
    });

    res.json({
      accessToken,
      refreshToken: refreshTokenString,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. REFRESH TOKEN ---
export const refreshToken = async (req, res) => {
  const { requestToken } = req.body;

  if (!requestToken) {
    return res.status(403).json({ message: "Refresh Token is required!" });
  }

  try {
    const refreshTokenInDB = await RefreshToken.findOne({ token: requestToken });

    if (!refreshTokenInDB) {
      return res.status(403).json({ message: "Refresh token is not in database!" });
    }

    if (RefreshToken.verifyExpiration(refreshTokenInDB)) {
      // Dùng findByIdAndDelete thay cho findByIdAndRemove (đã cũ)
      await RefreshToken.findByIdAndDelete(refreshTokenInDB._id);
      return res.status(403).json({ message: "Refresh token was expired. Please make a new signin request" });
    }

    const user = await User.findById(refreshTokenInDB.user);
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshTokenInDB.token,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// --- 4. LOGOUT ---
export const logout = async (req, res) => {
  try {
    const { token } = req.body; 
    await RefreshToken.findOneAndDelete({ token: token });
    
    res.status(200).json({ message: "Log out successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; // <--- ĐÃ SỬA: Đóng ngoặc hàm logout tại đây

// --- 5. FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy email này" });
  }

  // Lấy token reset từ model
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Tạo URL reset
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
  
  // Debug link trong console để test (nếu gửi mail lỗi)
  console.log("Reset Password Link:", resetUrl);

  const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.\n\nHãy click vào link dưới đây để đặt lại mật khẩu:\n\n${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Token",
      message,
    });

    res.status(200).json({ success: true, data: "Email đã được gửi!" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ message: "Không thể gửi email", error: error.message });
  }
};

// --- 6. RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  // Mã hóa token từ URL để so sánh với DB
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  // Tìm user có token khớp và chưa hết hạn
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }

  // Đặt mật khẩu mới
  user.password = await bcrypt.hash(req.body.password, 10);
  
  // Xóa token đi
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  await user.save();

  res.status(200).json({ success: true, data: "Mật khẩu đã được cập nhật!" });
};
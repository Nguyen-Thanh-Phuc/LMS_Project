import mongoose from "mongoose";
import crypto from "crypto"; 

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    banned: { type: Boolean, default: false },
    bannedReason: { type: String, default: "" },
    
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hàm tạo Token ngẫu nhiên (không phải JWT) để reset password
userSchema.methods.getResetPasswordToken = function () {
  // 1. Tạo chuỗi ngẫu nhiên
  const resetToken = crypto.randomBytes(20).toString("hex");

  // 2. Mã hóa chuỗi đó rồi lưu vào Database (để bảo mật)
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 3. Token chỉ có hiệu lực trong 10 phút
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken; 
};

export default mongoose.model("User", userSchema);
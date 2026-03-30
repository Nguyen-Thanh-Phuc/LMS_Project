import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  progress: {
   completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
   passedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }], 
   percentage: { type: Number, default: 0 } 
 },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

// Đảm bảo 1 user chỉ enroll 1 khóa học 1 lần (tránh trùng lặp)
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
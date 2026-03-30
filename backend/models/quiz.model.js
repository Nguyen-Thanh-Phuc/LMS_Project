import mongoose from "mongoose";
const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  totalScore: { type: Number, default: 100 }, // Yêu cầu 2: Luôn là 100
  passingScore: { type: Number, default: 75 },
  isBank: { 
    type: Boolean, 
    default: false 
  },
  
}, { timestamps: true });
export default mongoose.model("Quiz", quizSchema);
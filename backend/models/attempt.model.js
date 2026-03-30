import mongoose from "mongoose";

const attemptAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true
  },
  selectedOption: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  answers: {
    type: [attemptAnswerSchema],
    default: []
  },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true, alias: "isPassed" },
  attemptNumber: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model("Attempt", attemptSchema);

import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
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
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    default: null
  },
  certificateUrl: {
    type: String
  },
  qrCode: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "issued", "revoked"],
    default: "pending"
  }
}, { timestamps: true });

export default mongoose.model("Certificate", certificateSchema);

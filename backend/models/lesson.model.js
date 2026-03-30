import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  title: { type: String, required: true },
  videoUrl: { type: String, default: "" }, 
  content: { type: String }, // Nội dung văn bản (để Rich Text sau này)
  
  // THÊM DÒNG NÀY: Lưu link file PDF từ Cloudinary
  pdfUrl: { type: String, default: "" }, 
  
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Lesson", lessonSchema);
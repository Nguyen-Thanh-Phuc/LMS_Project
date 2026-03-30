import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String, // URL ảnh từ Cloudinary
    default: "https://via.placeholder.com/150"
  },
  price: {
    type: Number,
    default: 0 // 0 là miễn phí
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Link tới bảng User của bạn
    required: true
  },
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);
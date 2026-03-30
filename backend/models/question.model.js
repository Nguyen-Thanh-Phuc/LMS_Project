import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  // Link the question to the Admin/Instructor, NOT the course
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  options: [{ 
    type: String, 
    required: true 
  }],
  correctAnswer: { 
    type: Number, 
    required: true 
  },
  // Optional: Helps admins filter their global bank
  tags: [{ 
    type: String 
  }] 
}, { timestamps: true });

export default mongoose.model("Question", questionSchema);
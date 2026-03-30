import Quiz from "../models/quiz.model.js";
import Course from "../models/course.model.js";
import Question from "../models/question.model.js";
import Attempt from "../models/attempt.model.js";
import Enrollment from "../models/enrollment.model.js";
import Certificate from "../models/certificate.model.js";
import User from "../models/user.js";
import { ApiError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

// ==========================================
// 1. LẤY NGÂN HÀNG ĐỀ THI (QUIZ BANK)
// ==========================================
export const getInstructorQuizBank = async (req, res, next) => {
  try {
    const adminId = req.user._id;

    // Restrict bank quiz view to only the creating instructor
    const quizzes = await Quiz.find({ isBank: true, createdBy: adminId })
                              .populate("questions")
                              .sort("-createdAt");

    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. TẠO QUIZ (HỖ TRỢ TẠO TRONG BANK VÀ TRONG COURSE)
// ==========================================
export const createQuizWithQuestions = async (req, res, next) => {
  try {
    const { title, courseId, questionsData, isBankOnly, saveToBank } = req.body;
    const adminId = req.user._id;

    if (!title || !questionsData || questionsData.length === 0) {
      return next(new ApiError(400, "Vui lòng nhập tên Đề thi và ít nhất 1 câu hỏi."));
    }

    // 1. Lưu tất cả câu hỏi vào bảng Question
    const questionsToInsert = questionsData.map(q => ({
      createdBy: adminId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer
    }));
    const createdQuestions = await Question.insertMany(questionsToInsert);
    const questionIds = createdQuestions.map(q => q._id);

    // TRƯỜNG HỢP A: Admin tạo Đề thi trực tiếp từ trang Quiz Bank
    if (isBankOnly) {
      const bankQuiz = await Quiz.create({
        title, isBank: true, questions: questionIds, passingScore: 75, totalScore: 100, createdBy: adminId
      });
      return res.status(201).json({ success: true, data: bankQuiz });
    }

    // TRƯỜNG HỢP B: Admin tạo Đề thi bên trong Khóa học
    if (!courseId) return next(new ApiError(400, "Thiếu courseId."));

    const course = await Course.findById(courseId);
    if (!course) return next(new ApiError(404, "Course not found."));
    if (course.isPublished) {
      return next(new ApiError(400, "Khóa học đã mở, không thể thêm Quiz mới!"));
    }

    const courseQuiz = await Quiz.create({
      title, courseId, isBank: false, questions: questionIds, passingScore: 75, totalScore: 100, createdBy: adminId
    });

    // Nếu Admin tick "Lưu Đề thi này vào Bank", hệ thống nhân bản nó thành 1 Đề mẫu
    if (saveToBank) {
      await Quiz.create({
        title, isBank: true, questions: questionIds, passingScore: 75, totalScore: 100, createdBy: adminId
      });
    }

    res.status(201).json({ success: true, data: courseQuiz });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. IMPORT QUIZ TỪ BANK VÀO KHÓA HỌC
// ==========================================
export const importQuizFromBank = async (req, res, next) => {
  try {
    const { bankQuizId, courseId, newTitle } = req.body; // Lấy thêm newTitle từ Frontend
    const adminId = req.user._id;

    const bankQuiz = await Quiz.findById(bankQuizId);
    if (!bankQuiz) return next(new ApiError(404, "Không tìm thấy Đề thi mẫu."));

    const course = await Course.findById(courseId);
    if (!course) return next(new ApiError(404, "Course not found."));
    if (course.isPublished) {
      return next(new ApiError(400, "Khóa học đã mở, không thể thêm Quiz mới!"));
    }

    const newQuiz = await Quiz.create({
      title: newTitle || bankQuiz.title, // Dùng tên mới (nếu có), không thì xài tên gốc
      courseId,
      isBank: false,
      questions: bankQuiz.questions,
      passingScore: bankQuiz.passingScore,
      totalScore: bankQuiz.totalScore,
      createdBy: adminId
    });

    res.status(201).json({ success: true, data: newQuiz });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. STUDENT SUBMIT QUIZ & AUTO-GRADING
// ==========================================
export const submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return next(new ApiError(404, "Quiz not found"));

    // Prevent retaking the same quiz once an attempt exists
    const existingAttempt = await Attempt.findOne({ userId, quizId });
    if (existingAttempt) {
      return next(new ApiError(400, "You have already submitted this quiz. Please review your answers."));
    }

    const totalQuestions = quiz.questions.length;
    const pointsPerQuestion = 100 / totalQuestions;
    let score = 0;

    quiz.questions.forEach((q, index) => {
    const studentAnswer = answers[index];
    const correctAnswer = q.correctAnswer;

    if (String(studentAnswer) === String(correctAnswer)) {
    score += pointsPerQuestion;
  }
});

    score = Math.round(score);
    const passed = score >= quiz.passingScore;

    // Count previous attempts
    const previousAttempts = await Attempt.countDocuments({ userId, quizId });

    const answersData = quiz.questions.map((q, index) => {
      const studentAnswer = answers?.[index];
      const isCorrect = String(studentAnswer) === String(q.correctAnswer);

      return {
        questionId: q._id,
        selectedOption: studentAnswer,
        isCorrect
      };
    });

    const attempt = await Attempt.create({
      userId,
      quizId,
      courseId: quiz.courseId,
      answers: answersData,
      score,
      passed,
      attemptNumber: previousAttempts + 1
    });

    // If passed → update enrollment
    if (passed) {
      const enrollment = await Enrollment.findOne({
        userId,
        courseId: quiz.courseId
      });

      if (enrollment) {
        // Add quiz only if not already included
        const alreadyPassed = enrollment.progress.passedQuizzes.some(
          id => id.toString() === quizId
        );

        if (!alreadyPassed) {
          enrollment.progress.passedQuizzes.push(quizId);
        }

        const totalQuizzes = await Quiz.countDocuments({
          courseId: quiz.courseId
        });

        if (totalQuizzes > 0) {
          const passedCount = enrollment.progress.passedQuizzes.length;

          enrollment.progress.percentage = Math.round(
            (passedCount / totalQuizzes) * 100
          );

          if (passedCount === totalQuizzes) {
            enrollment.isCompleted = true;

            // Generate certificate automatically
            const existingCert = await Certificate.findOne({
              userId: enrollment.userId,
              courseId: enrollment.courseId,
              status: "issued"
            });

            if (!existingCert) {
              const user = await User.findById(enrollment.userId);
              const course = await Course.findById(enrollment.courseId);

              if (user && course) {
                const certificateId = `CERT-${uuidv4()}`;

                await Certificate.create({
                  userId: enrollment.userId,
                  courseId: enrollment.courseId,
                  certificateId,
                  courseName: course.title,
                  studentName: user.name,
                  completionDate: new Date(),
                  score,
                  status: "issued"
                });

                console.log(`Certificate ${certificateId} issued to ${user.name} for course ${course.title}`);
              }
            }
          }
        }

        await enrollment.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        score,
        passed,
        attemptNumber: attempt.attemptNumber
      }
    });

  } catch (error) {
    next(error);
  }
};

// ==========================================
// STANDARD CRUD OPERATIONS
// ==========================================

export const getQuizzes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", courseId, search } = req.query;
    let filter = {};
    if (courseId) filter.courseId = courseId;
    if (search) filter.title = { $regex: search, $options: "i" };
    
    const skip = (page - 1) * limit;
    const quizzes = await Quiz.find(filter)
      .populate("courseId", "title")
      .sort(sort).skip(skip).limit(Number(limit));
      
    const total = await Quiz.countDocuments(filter);
    res.status(200).json({ success: true, data: quizzes, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (error) { 
    next(error); 
  }
};

export const getQuizById = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) return next(new ApiError(404, "Quiz not found"));

    // Allow admins/instructors to access quiz details without enrollment
    if (userRole === 'admin' || quiz.createdBy?.toString() === userId.toString()) {
      // Return full quiz data for admins/instructors
      res.status(200).json({ success: true, data: quiz });
      return;
    }

    // For students: check enrollment
    const enrollment = await Enrollment.findOne({
      userId,
      courseId: quiz.courseId
    });

    if (!enrollment) {
      return next(new ApiError(403, "Not enrolled in this course"));
    }

    // Optional: block if already passed
    const alreadyPassed = enrollment.progress.passedQuizzes.some(
      id => id.toString() === quizId
    );

    if (alreadyPassed) {
      return next(new ApiError(400, "Quiz already completed"));
    }

    // Hide correct answers for students
    const quizObj = quiz.toObject();
    quizObj.questions.forEach(q => delete q.correctAnswer);

    res.status(200).json({ success: true, data: quizObj });

  } catch (error) {
    next(error);
  }
};

export const getQuizzesByCourse = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId });
    res.status(200).json({ success: true, data: quizzes, count: quizzes.length });
  } catch (error) { 
    next(error); 
  }
};

export const createQuiz = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) return next(new ApiError(404, "Course not found."));
      if (course.isPublished) {
        return next(new ApiError(400, "Khóa học đã mở, không thể thêm Quiz mới!"));
      }
    }

    const created = await Quiz.create(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

export const updateQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.quizId;

    // Check if quiz has any attempts
    const attemptCount = await Attempt.countDocuments({ quizId });
    if (attemptCount > 0) {
      return next(new ApiError(400, "Cannot edit quiz that has been attempted by students"));
    }

    const { questions, ...updateData } = req.body;

    // If questions are being updated, update the individual Question documents
    if (questions !== undefined) {
      const quiz = await Quiz.findById(quizId).populate('questions');
      if (!quiz) return next(new ApiError(404, "Quiz not found"));

      // Update each question document
      const updatedQuestionIds = [];
      for (let i = 0; i < questions.length; i++) {
        const questionData = questions[i];

        // If the question has an _id, update the existing Question document
        if (questionData._id) {
          await Question.findByIdAndUpdate(questionData._id, {
            questionText: questionData.questionText,
            options: questionData.options,
            correctAnswer: questionData.correctAnswer
          });
          updatedQuestionIds.push(questionData._id);
        } else {
          // If no _id, this is a new question (though we shouldn't be adding new ones in edit mode)
          // For now, skip adding new questions in edit mode
          console.warn('New question without _id in edit mode, skipping');
        }
      }

      // Remove questions that are no longer in the updated list
      const currentQuestionIds = quiz.questions.map(q => q._id.toString());
      const updatedQuestionIdsStr = updatedQuestionIds.map(id => id.toString());

      const questionsToDelete = currentQuestionIds.filter(id => !updatedQuestionIdsStr.includes(id));
      if (questionsToDelete.length > 0) {
        await Question.deleteMany({ _id: { $in: questionsToDelete } });
      }

      // Update the quiz's questions array
      updateData.questions = updatedQuestionIds;
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(quizId, updateData, { new: true }).populate('questions');
    if (!updatedQuiz) {
      return next(new ApiError(404, "Quiz not found"));
    }

    res.status(200).json({ success: true, data: updatedQuiz });
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (req, res, next) => {
  try {
    const quizId = req.params.quizId;

    // Check if quiz has any attempts
    const attemptCount = await Attempt.countDocuments({ quizId });
    if (attemptCount > 0) {
      return next(new ApiError(400, "Cannot delete quiz that has been attempted by students"));
    }

    await Quiz.findByIdAndDelete(quizId);
    res.status(200).json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Legacy add question route
export const addQuestion = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    const newQ = await Question.create({ createdBy: req.user._id, ...req.body });
    quiz.questions.push(newQ._id); 
    await quiz.save();
    res.status(200).json({ success: true, data: quiz });
  } catch (error) { 
    next(error); 
  }
};
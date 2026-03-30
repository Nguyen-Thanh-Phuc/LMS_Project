import Attempt from "../models/attempt.model.js";
import Quiz from "../models/quiz.model.js";
import { ApiError } from "../middleware/errorHandler.js";


// ===============================
// Submit Quiz Attempt
// ===============================
export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { quizId, courseId, answers } = req.body;
    const userId = req.user._id; // ✅ secure

    if (!quizId || !courseId || !answers || !Array.isArray(answers)) {
      return next(new ApiError(400, "quizId, courseId and answers are required"));
    }

    // ✅ Populate questions
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return next(new ApiError(404, "Quiz not found"));
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return next(new ApiError(400, "Quiz has no questions"));
    }

    let correctAnswers = 0;

    const gradedAnswers = quiz.questions.map((question, idx) => {
      const userAnswer = answers[idx];

      // ✅ Index-based correct answer comparison
      const isCorrect =
        Number(userAnswer) === Number(question.correctAnswer);

      if (isCorrect) correctAnswers++;

      return {
        questionId: question._id,
        selectedOption: userAnswer,
        isCorrect
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round(
      (correctAnswers / totalQuestions) * 100
    );

    const passed = percentage >= quiz.passingScore;

    const attemptNumber =
      (await Attempt.countDocuments({ userId, quizId })) + 1;

    const attempt = await Attempt.create({
      userId,
      quizId,
      courseId,
      answers: gradedAnswers,
      score: correctAnswers,
      totalQuestions,
      percentage,
      passed,
      status: "graded",
      attemptNumber
    });

    res.status(201).json({
      success: true,
      message: "Quiz submitted and graded",
      data: {
        score: correctAnswers,
        totalQuestions,
        percentage,
        passed,
        passingScore: quiz.passingScore,
        attemptNumber
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===============================
// Get User Attempts
// ===============================
export const getUserAttempts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, quizId } = req.query;

    const filter = { userId };
    if (quizId) filter.quizId = quizId;

    const skip = (Number(page) - 1) * Number(limit);

    const attempts = await Attempt.find(filter)
      .populate("quizId", "title passingScore")
      .populate("courseId", "title")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit));

    const total = await Attempt.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: attempts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===============================
// Get Quiz Attempts (Admin)
// ===============================
export const getQuizAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const adminId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return next(new ApiError(404, "Quiz not found"));

    if (!quiz.createdBy.equals(adminId)) {
      return next(new ApiError(403, "Not authorized to view attempts for this quiz"));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const attempts = await Attempt.find({ quizId })
      .populate("userId", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit));

    const total = await Attempt.countDocuments({ quizId });

    res.status(200).json({
      success: true,
      data: attempts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===============================
// Get Single Attempt
// ===============================
export const getAttemptById = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findById(attemptId)
      .populate("userId", "name email")
      .populate({
        path: "quizId",
        select: "title passingScore questions",
        populate: {
          path: "questions",
          select: "questionText options correctAnswer"
        }
      })
      .populate("courseId", "title")
      .populate({
        path: "answers.questionId",
        select: "questionText options correctAnswer"
      });

    if (!attempt) {
      return next(new ApiError(404, "Attempt not found"));
    }

    res.status(200).json({
      success: true,
      data: attempt
    });

  } catch (error) {
    next(error);
  }
};


// ===============================
// Get Best Attempt
// ===============================
export const getBestAttempt = async (req, res, next) => {
  try {
    const { userId, quizId } = req.params;

    const attempt = await Attempt.findOne({ userId, quizId })
      .sort("-percentage")
      .populate("quizId", "title");

    if (!attempt) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });

  } catch (error) {
    next(error);
  }
};


// ===============================
// Get Quiz Stats
// ===============================
export const getQuizStats = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const attempts = await Attempt.find({
      quizId,
      status: "graded"
    });

    if (!attempts.length) {
      return res.status(200).json({
        success: true,
        data: {
          totalAttempts: 0,
          averageScore: 0,
          passedCount: 0,
          passRate: 0,
          averagePercentage: 0
        }
      });
    }

    const passedCount = attempts.filter(a => a.passed).length;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const totalPercentage = attempts.reduce((sum, a) => sum + a.percentage, 0);

    const avgScore = totalScore / attempts.length;
    const avgPercentage = totalPercentage / attempts.length;
    const passRate = (passedCount / attempts.length) * 100;

    res.status(200).json({
      success: true,
      data: {
        totalAttempts: attempts.length,
        averageScore: avgScore.toFixed(2),
        passedCount,
        passRate: passRate.toFixed(2),
        averagePercentage: avgPercentage.toFixed(2)
      }
    });

  } catch (error) {
    next(error);
  }
};


// ===============================
// Delete Attempt
// ===============================
export const deleteAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await Attempt.findByIdAndDelete(attemptId);

    if (!attempt) {
      return next(new ApiError(404, "Attempt not found"));
    }

    res.status(200).json({
      success: true,
      message: "Attempt deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};


// ===============================
// Get My Attempt For Quiz
// ===============================
export const getMyAttemptForQuiz = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { quizId } = req.params;

    const attempt = await Attempt.findOne({ userId, quizId })
      .sort("-createdAt")
      .populate({
        path: "quizId",
        select: "title passingScore questions",
        populate: {
          path: "questions",
          select: "questionText options correctAnswer"
        }
      })
      .populate({
        path: "answers.questionId",
        select: "questionText options correctAnswer"
      });

    res.status(200).json({
      success: true,
      data: attempt || null
    });

  } catch (error) {
    next(error);
  }
};
export const getMyAttemptsByCourse = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const attempts = await Attempt.find({
      userId,
      courseId
    });

    res.status(200).json({
      success: true,
      data: attempts || []
    });

  } catch (error) {
    next(error);
  }
};
export const getMyAttemptHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const attempts = await Attempt.find({ userId })
      .populate({
        path: "quizId",
        select: "title passingScore courseId",
        populate: {
          path: "courseId",
          select: "title"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: attempts || []
    });

  } catch (error) {
    next(error);
  }
};
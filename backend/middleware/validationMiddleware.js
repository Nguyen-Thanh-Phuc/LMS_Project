import Joi from "joi";

// Helper function for validation errors
const handleValidationError = (error, res) => {
  if (error) {
    return res.status(400).json({ 
      success: false,
      message: error.details[0].message 
    });
  }
  return null;
};

// ===== AUTH VALIDATION =====
export const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required().messages({
      "string.empty": "Tên không được để trống",
      "string.min": "Tên phải có ít nhất 3 ký tự"
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống"
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
      "string.empty": "Mật khẩu không được để trống"
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateForgotPassword = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống"
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const schema = Joi.object({
    password: Joi.string().min(6).required().messages({
      "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
      "string.empty": "Mật khẩu mới không được để trống"
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== COURSE VALIDATION =====
export const validateCreateCourse = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required().messages({
      "string.empty": "Tiêu đề khóa học không được để trống",
      "string.min": "Tiêu đề phải có ít nhất 3 ký tự"
    }),
    description: Joi.string().min(10).required().messages({
      "string.empty": "Mô tả không được để trống",
      "string.min": "Mô tả phải có ít nhất 10 ký tự"
    }),
    // Thumbnail và Price để optional (không bắt buộc) là chính xác
    thumbnail: Joi.string().uri().optional(),
    price: Joi.number().min(0).optional()
    
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      message: error.details[0].message 
    });
  }
  next();
};

export const validateUpdateCourse = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().min(10).optional(),
    thumbnail: Joi.string().uri().optional(),
    price: Joi.number().min(0).optional(),
    isPublished: Joi.boolean().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== LESSON VALIDATION =====
export const validateCreateLesson = (req, res, next) => {
  const schema = Joi.object({
    courseId: Joi.string().required().messages({
      "string.empty": "CourseId không được để trống"
    }),
    title: Joi.string().min(3).max(100).required().messages({
      "string.empty": "Tiêu đề bài học không được để trống",
      "string.min": "Tiêu đề phải có ít nhất 3 ký tự"
    }),
    videoUrl: Joi.string().uri().required().messages({
      "string.empty": "Video URL không được để trống",
      "string.uri": "Video URL phải là URL hợp lệ"
    }),
    content: Joi.string().optional(),
    order: Joi.number().min(0).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateLesson = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    videoUrl: Joi.string().uri().optional(),
    content: Joi.string().optional(),
    order: Joi.number().min(0).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== QUIZ VALIDATION =====
export const validateCreateQuiz = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required().messages({
      "string.empty": "Tiêu đề quiz không được để trống",
      "string.min": "Tiêu đề phải có ít nhất 3 ký tự"
    }),
    description: Joi.string().optional(),
    courseId: Joi.string().required().messages({
      "string.empty": "CourseId không được để trống"
    }),
    lessonId: Joi.string().optional(),
    questions: Joi.array().items(
      Joi.object({
        question: Joi.string().required(),
        options: Joi.array().items(
          Joi.object({
            text: Joi.string().required(),
            isCorrect: Joi.boolean().required()
          })
        ).required(),
        type: Joi.string().valid("multiple-choice").optional()
      })
    ).min(1).required().messages({
      "array.min": "Quiz phải có ít nhất 1 câu hỏi"
    }),
    passingScore: Joi.number().min(0).max(100).optional(),
    createdBy: Joi.string().required().messages({
      "string.empty": "ID người tạo không được để trống"
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateUpdateQuiz = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().optional(),
    questions: Joi.array().items(
      Joi.object({
        _id: Joi.string().optional(),
        createdBy: Joi.string().optional(),
        questionText: Joi.string().required(),
        options: Joi.array().items(Joi.string().required()).min(2).required(),
        correctAnswer: Joi.number().min(0).required()
      }).unknown(true)
    ).optional(),
    passingScore: Joi.number().min(0).max(100).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateAddQuestion = (req, res, next) => {
  const schema = Joi.object({
    question: Joi.string().required().messages({
      "string.empty": "Câu hỏi không được để trống"
    }),
    options: Joi.array().items(
      Joi.object({
        text: Joi.string().required(),
        isCorrect: Joi.boolean().required()
      })
    ).min(2).required().messages({
      "array.min": "Phải có ít nhất 2 lựa chọn"
    }),
    type: Joi.string().valid("multiple-choice").optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== ENROLLMENT VALIDATION =====
export const validateEnrollCourse = (req, res, next) => {
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: "CourseId is required",
    });
  }

  next();
};

export const validateUpdateEnrollmentProgress = (req, res, next) => {
  const schema = Joi.object({
    progress: Joi.number().min(0).max(100).optional(),
    completedLessons: Joi.array().items(Joi.string()).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== ATTEMPT VALIDATION =====
export const validateSubmitAttempt = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "UserId không được để trống"
    }),
    quizId: Joi.string().required().messages({
      "string.empty": "QuizId không được để trống"
    }),
    courseId: Joi.string().required().messages({
      "string.empty": "CourseId không được để trống"
    }),
    answers: Joi.array().items(Joi.string()).min(1).required().messages({
      "array.min": "Phải có ít nhất một câu trả lời"
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== CERTIFICATE VALIDATION =====
export const validateGenerateCertificate = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().optional().messages({
      "string.empty": "UserId không được để trống"
    }),
    courseId: Joi.string().required().messages({
      "string.empty": "CourseId không được để trống"
    }),
    score: Joi.number().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== USER VALIDATION =====
export const validateUpdateUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).optional(),
    email: Joi.string().email().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateChangeUserRole = (req, res, next) => {
  const schema = Joi.object({
    role: Joi.string().valid("user", "admin", "staff").required().messages({
      "string.empty": "Role không được để trống",
      "any.only": "Role phải là: user, admin, hoặc staff"
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

// ===== PAGINATION VALIDATION =====
export const validatePagination = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    search: Joi.string().optional()
  });

  const { error, value } = schema.validate(req.query, { allowUnknown: true });
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  Object.assign(req.query, value);
  next();
};
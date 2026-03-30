import request from 'supertest';
import express from 'express';
import quizzesRoutes from '../routes/quizzes.routes.js';
import attemptsRoutes from '../routes/attempts.routes.js';
import {
  connectTestDB,
  disconnectTestDB,
  clearDatabase,
  seedTestUser,
  seedTestAdmin,
  generateTestToken,
} from './testHelper.js';
import Course from '../models/course.model.js';
import Quiz from '../models/quiz.model.js';
import Attempt from '../models/attempt.model.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/attempts', attemptsRoutes);

describe('Quiz Endpoints', () => {
  let testUser;
  let testAdmin;
  let userToken;
  let adminToken;
  let courseId;
  let quizId;

  const sampleQuestions = [
    {
      text: 'What is 2 + 2?',
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false },
      ],
    },
    {
      text: 'What is the capital of France?',
      options: [
        { text: 'London', isCorrect: false },
        { text: 'Paris', isCorrect: true },
        { text: 'Berlin', isCorrect: false },
      ],
    },
  ];

  beforeAll(async () => {
    await connectTestDB();
    testUser = await seedTestUser({ email: 'student@example.com' });
    testAdmin = await seedTestAdmin({ email: 'admin@example.com' });
    userToken = generateTestToken(testUser._id, 'user');
    adminToken = generateTestToken(testAdmin._id, 'admin');

    // Create a course
    const course = await Course.create({
      title: 'Quiz Test Course',
      description: 'Test course for quizzes',
      instructor: testAdmin._id,
      price: 29.99,
    });
    courseId = course._id;
  });

  afterEach(async () => {
    await clearDatabase();
    testUser = await seedTestUser({ email: 'student@example.com' });
    testAdmin = await seedTestAdmin({ email: 'admin@example.com' });

    const course = await Course.create({
      title: 'Quiz Test Course',
      description: 'Test course for quizzes',
      instructor: testAdmin._id,
      price: 29.99,
    });
    courseId = course._id;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('POST /api/quizzes (Create Quiz)', () => {
    it('should create quiz as admin', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Math Quiz',
          description: 'Basic math questions',
          courseId: courseId.toString(),
          createdBy: testAdmin._id.toString(),
          questions: sampleQuestions,
          passingScore: 50,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Math Quiz');
      expect(res.body.data.questions.length).toBe(2);

      quizId = res.body.data._id;
    });

    it('should reject quiz creation without questions', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Empty Quiz',
          courseId: courseId.toString(),
          createdBy: testAdmin._id.toString(),
          questions: [],
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject quiz creation when course is published', async () => {
      await Course.findByIdAndUpdate(courseId, { isPublished: true });
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Blocked Quiz',
          courseId: courseId.toString(),
          createdBy: testAdmin._id.toString(),
          questions: sampleQuestions,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Khóa học đã mở, không thể thêm Quiz mới!');
    });

    it('should reject quiz creation without authentication', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .send({
          title: 'Unauthorized Quiz',
          courseId: courseId.toString(),
          createdBy: testAdmin._id.toString(),
          questions: sampleQuestions,
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/quizzes (Get All Quizzes)', () => {
    beforeEach(async () => {
      const quiz = await Quiz.create({
        title: 'Sample Quiz',
        courseId,
        createdBy: testAdmin._id,
        questions: sampleQuestions,
        passingScore: 60,
        totalQuestions: sampleQuestions.length,
      });
      quizId = quiz._id;
    });

    it('should get all quizzes', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter quizzes by courseId', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .query({ courseId: courseId.toString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].courseId._id).toBe(courseId.toString());
    });

    it('should search quizzes by title', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .query({ search: 'Sample' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/quizzes/:id (Get Single Quiz)', () => {
    beforeEach(async () => {
      const quiz = await Quiz.create({
        title: 'Single Quiz Test',
        courseId,
        createdBy: testAdmin._id,
        questions: sampleQuestions,
        passingScore: 60,
        totalQuestions: sampleQuestions.length,
      });
      quizId = quiz._id;
    });

    it('should get quiz by id without answers for students', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${quizId.toString()}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Single Quiz Test');

      // Verify answers are hidden
      res.body.data.questions.forEach((q) => {
        q.options.forEach((opt) => {
          expect(opt.isCorrect).toBeUndefined();
        });
      });
    });

    it('should get quiz with answers for admin', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${quizId.toString()}`)
        .query({ includeAnswers: true })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      // Answers should be visible
      const correctCount = res.body.data.questions[0].options.filter(
        (opt) => opt.isCorrect === true
      ).length;
      expect(correctCount).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/quizzes/:id (Update Quiz)', () => {
    beforeEach(async () => {
      const quiz = await Quiz.create({
        title: 'Original Quiz',
        courseId,
        createdBy: testAdmin._id,
        questions: sampleQuestions,
        passingScore: 60,
        totalQuestions: sampleQuestions.length,
      });
      quizId = quiz._id;
    });

    it('should update quiz as admin', async () => {
      const res = await request(app)
        .put(`/api/quizzes/${quizId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Quiz Title',
          passingScore: 70,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Updated Quiz Title');
      expect(res.body.data.passingScore).toBe(70);
    });
  });
});

describe('Quiz Attempts - Auto-Grading', () => {
  let testUser;
  let testAdmin;
  let userToken;
  let adminToken;
  let courseId;
  let quizId;

  const sampleQuestions = [
    {
      text: 'What is 2 + 2?',
      options: [
        { text: '3', isCorrect: false },
        { text: '4', isCorrect: true },
        { text: '5', isCorrect: false },
      ],
    },
    {
      text: 'What is the capital of France?',
      options: [
        { text: 'London', isCorrect: false },
        { text: 'Paris', isCorrect: true },
        { text: 'Berlin', isCorrect: false },
      ],
    },
  ];

  beforeAll(async () => {
    await connectTestDB();
    testUser = await seedTestUser({ email: 'attemptuser@example.com' });
    testAdmin = await seedTestAdmin({ email: 'attemptadmin@example.com' });
    userToken = generateTestToken(testUser._id, 'user');
    adminToken = generateTestToken(testAdmin._id, 'admin');

    const course = await Course.create({
      title: 'Attempt Test Course',
      description: 'Test course for attempts',
      instructor: testAdmin._id,
      price: 29.99,
    });
    courseId = course._id;

    const quiz = await Quiz.create({
      title: 'Grading Test Quiz',
      courseId,
      createdBy: testAdmin._id,
      questions: sampleQuestions,
      passingScore: 50,
      totalQuestions: sampleQuestions.length,
    });
    quizId = quiz._id;
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('POST /api/attempts (Submit Quiz)', () => {
    it('should submit quiz and auto-grade - all correct', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: testUser._id.toString(),
          quizId: quizId.toString(),
          courseId: courseId.toString(),
          answers: ['4', 'Paris'], // All correct
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.score).toBe(2);
      expect(res.body.data.result.percentage).toBe(100);
      expect(res.body.data.result.passed).toBe(true);
    });

    it('should submit quiz and auto-grade - partial correct', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: testUser._id.toString(),
          quizId: quizId.toString(),
          courseId: courseId.toString(),
          answers: ['4', 'London'], // 1 correct, 1 wrong
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.result.score).toBe(1);
      expect(res.body.data.result.percentage).toBe(50);
      expect(res.body.data.result.passed).toBe(true); // >= passingScore of 50
    });

    it('should submit quiz and auto-grade - all wrong', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: testUser._id.toString(),
          quizId: quizId.toString(),
          courseId: courseId.toString(),
          answers: ['3', 'London'], // All wrong
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.result.score).toBe(0);
      expect(res.body.data.result.percentage).toBe(0);
      expect(res.body.data.result.passed).toBe(false);
    });

    it('should reject attempt without required fields', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: testUser._id.toString(),
          // missing quizId and courseId
          answers: ['4', 'Paris'],
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/attempts/user/:userId (Get User Attempts)', () => {
    beforeEach(async () => {
      // Submit a few attempts
      await Attempt.create({
        userId: testUser._id,
        quizId,
        courseId,
        answers: [
          { questionId: sampleQuestions[0]._id, selectedOption: '4', isCorrect: true },
          { questionId: sampleQuestions[1]._id, selectedOption: 'Paris', isCorrect: true },
        ],
        score: 2,
        totalQuestions: 2,
        percentage: 100,
        passed: true,
        status: 'graded',
        attemptNumber: 1,
      });
    });

    it('should get user attempts', async () => {
      const res = await request(app)
        .get(`/api/attempts/user/${testUser._id.toString()}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter attempts by quiz', async () => {
      const res = await request(app)
        .get(`/api/attempts/user/${testUser._id.toString()}`)
        .query({ quizId: quizId.toString() })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data[0].quizId).toBe(quizId.toString());
    });
  });

  describe('GET /api/attempts/quiz/:quizId/stats (Quiz Stats)', () => {
    beforeEach(async () => {
      // Create attempts with different scores
      await Attempt.create({
        userId: testUser._id,
        quizId,
        courseId,
        score: 2,
        totalQuestions: 2,
        percentage: 100,
        passed: true,
        status: 'graded',
      });

      await Attempt.create({
        userId: testUser._id,
        quizId,
        courseId,
        score: 0,
        totalQuestions: 2,
        percentage: 0,
        passed: false,
        status: 'graded',
      });
    });

    it('should get quiz statistics', async () => {
      const res = await request(app)
        .get(`/api/attempts/quiz/${quizId.toString()}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('totalAttempts');
      expect(res.body.data).toHaveProperty('averageScore');
      expect(res.body.data).toHaveProperty('passRate');
    });
  });

  describe('GET /api/attempts/:id (Get Attempt Details)', () => {
    let attemptId;

    beforeEach(async () => {
      const attempt = await Attempt.create({
        userId: testUser._id,
        quizId,
        courseId,
        answers: [
          { questionId: sampleQuestions[0]._id, selectedOption: '4', isCorrect: true },
        ],
        score: 1,
        totalQuestions: 2,
        percentage: 50,
        passed: true,
        status: 'graded',
        attemptNumber: 1,
      });
      attemptId = attempt._id;
    });

    it('should get attempt by id', async () => {
      const res = await request(app)
        .get(`/api/attempts/${attemptId.toString()}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(attemptId.toString());
      expect(res.body.data.score).toBe(1);
    });
  });
});

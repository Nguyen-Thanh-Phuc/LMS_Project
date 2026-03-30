import request from 'supertest';
import express from 'express';
import adminRoutes from '../routes/admin.routes.js';
import {
  connectTestDB,
  disconnectTestDB,
  clearDatabase,
  seedTestUser,
  seedTestAdmin,
  generateTestToken,
} from './testHelper.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Quiz from '../models/quiz.model.js';
import Attempt from '../models/attempt.model.js';
import Certificate from '../models/certificate.model.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Dashboard Endpoints', () => {
  let testAdmin;
  let testUser;
  let adminToken;
  let userToken;
  let courseId;
  let quizId;

  beforeAll(async () => {
    await connectTestDB();
    testAdmin = await seedTestAdmin({ email: 'dashboardadmin@example.com' });
    testUser = await seedTestUser({ email: 'dashboarduser@example.com' });
    adminToken = generateTestToken(testAdmin._id, 'admin');
    userToken = generateTestToken(testUser._id, 'user');
  });

  afterEach(async () => {
    await clearDatabase();
    testAdmin = await seedTestAdmin({ email: 'dashboardadmin@example.com' });
    testUser = await seedTestUser({ email: 'dashboarduser@example.com' });
    adminToken = generateTestToken(testAdmin._id, 'admin');
    userToken = generateTestToken(testUser._id, 'user');
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('GET /api/admin/dashboard/overview (Dashboard Overview)', () => {
    beforeEach(async () => {
      // Create sample data
      await Course.create({
        title: 'Test Course',
        description: 'Test course',
        instructor: testAdmin._id,
        price: 29.99,
      });
    });

    it('should return dashboard overview as admin', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('content');
      expect(res.body.data).toHaveProperty('enrollments');
      expect(res.body.data).toHaveProperty('certificates');
      expect(res.body.data.content).toHaveProperty('courses');
      expect(res.body.data.users).toHaveProperty('students');
    });

    it('should reject access for non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/overview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should reject access without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/overview');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/admin/dashboard/analytics (Analytics)', () => {
    beforeEach(async () => {
      const course = await Course.create({
        title: 'Analytics Test Course',
        description: 'Test',
        instructor: testAdmin._id,
        price: 29.99,
      });
      courseId = course._id;
    });

    it('should return analytics data', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('popularCourses');
      expect(res.body.data).toHaveProperty('recentEnrollments');
    });
  });

  describe('GET /api/admin/courses (Get All Courses with Stats)', () => {
    beforeEach(async () => {
      await Course.create({
        title: 'JavaScript Course',
        description: 'Learn JavaScript',
        instructor: testAdmin._id,
        price: 49.99,
      });
      await Course.create({
        title: 'Python Course',
        description: 'Learn Python',
        instructor: testAdmin._id,
        price: 39.99,
      });
    });

    it('should get all courses with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/courses')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter courses by search term', async () => {
      const res = await request(app)
        .get('/api/admin/courses')
        .query({ search: 'JavaScript' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('JavaScript');
    });

    it('should sort courses', async () => {
      const res = await request(app)
        .get('/api/admin/courses')
        .query({ sort: '-createdAt' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/students (Get All Students)', () => {
    let course;

    beforeEach(async () => {
      await seedTestUser({ email: 'student1@example.com' });
      await seedTestUser({ email: 'student2@example.com' });

      course = await Course.create({
        title: 'Student Test Course',
        description: 'Test for students',
        instructor: testAdmin._id,
        price: 19.99,
      });

      const student = await seedTestUser({
        name: 'Enrolled Student',
        email: 'enrolledstudent@example.com'
      });

      await Enrollment.create({
        userId: student._id,
        courseId: course._id,
        progress: { percentage: 30 },
      });
    });

    it('should get all students', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should search students by name', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .query({ search: 'Enrolled' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/enrollments (Get All Enrollments)', () => {
    beforeEach(async () => {
      const course = await Course.create({
        title: 'Enrollment Test Course',
        description: 'Test',
        instructor: testAdmin._id,
        price: 29.99,
      });

      await Enrollment.create({
        userId: testUser._id,
        courseId: course._id,
        enrollmentDate: new Date(),
        progress: 50,
        completedLessons: [],
      });
    });

    it('should get all enrollments', async () => {
      const res = await request(app)
        .get('/api/admin/enrollments')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter enrollments by status', async () => {
      const res = await request(app)
        .get('/api/admin/enrollments')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/quizzes (Get All Quizzes)', () => {
    beforeEach(async () => {
      const course = await Course.create({
        title: 'Quiz Test Course',
        description: 'Test',
        instructor: testAdmin._id,
        price: 29.99,
      });

      await Quiz.create({
        title: 'Sample Quiz',
        courseId: course._id,
        createdBy: testAdmin._id,
        questions: [],
        passingScore: 60,
        totalScore: 100
      });
    });

    it('should get all quizzes with statistics', async () => {
      const res = await request(app)
        .get('/api/admin/quizzes')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/admin/attempts (Get All Attempts)', () => {
    beforeEach(async () => {
      const course = await Course.create({
        title: 'Attempts Test Course',
        description: 'Test',
        instructor: testAdmin._id,
        price: 29.99,
      });

      const quiz = await Quiz.create({
        title: 'Test Quiz',
        courseId: course._id,
        createdBy: testAdmin._id,
        questions: [],
        passingScore: 60,
        totalScore: 100
      });

      await Attempt.create({
        userId: testUser._id,
        quizId: quiz._id,
        courseId: course._id,
        score: 1,
        totalQuestions: 1,
        percentage: 100,
        passed: true,
        status: 'graded',
      });
    });

    it('should get all quiz attempts', async () => {
      const res = await request(app)
        .get('/api/admin/attempts')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter attempts by passed flag', async () => {
      const res = await request(app)
        .get('/api/admin/attempts')
        .query({ passed: 'true' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/certificates (Get All Certificates)', () => {
    beforeEach(async () => {
      const course = await Course.create({
        title: 'Certificate Test Course',
        description: 'Test',
        instructor: testAdmin._id,
        price: 29.99,
      });

      await Certificate.create({
        userId: testUser._id,
        courseId: course._id,
        certificateId: 'CERT-001',
        courseName: course.title,
        studentName: testUser.name,
        completionDate: new Date(),
        status: 'issued',
      });
    });

    it('should get all certificates', async () => {
      const res = await request(app)
        .get('/api/admin/certificates')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // each certificate should include populated userId and courseId
      expect(res.body.data[0]).toHaveProperty('userId');
      expect(res.body.data[0]).toHaveProperty('courseId');
    });

    it('should filter certificates by status', async () => {
      const res = await request(app)
        .get('/api/admin/certificates')
        .query({ status: 'issued' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow downloading a certificate as PDF', async () => {
      const cert = await Certificate.findOne({ certificateId: 'CERT-001' });
      const res = await request(app)
        .get(`/api/certificates/${cert._id}/download`)
        .set('Authorization', `Bearer ${adminToken}`); // token not required but safe

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/pdf/);
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('GET /api/admin/courses/:courseId/stats (Course Detailed Stats)', () => {
    beforeEach(async () => {
      const course = await Course.create({
        title: 'Stats Test Course',
        description: 'Test course for detailed stats',
        instructor: testAdmin._id,
        price: 29.99,
      });
      courseId = course._id;

      await Enrollment.create({
        userId: testUser._id,
        courseId: course._id,
        enrollmentDate: new Date(),
        progress: 75,
        completedLessons: [],
      });
    });

    it('should get detailed course statistics', async () => {
      const res = await request(app)
        .get(`/api/admin/courses/${courseId.toString()}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('course');
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data.stats).toHaveProperty('enrollments');
      expect(res.body.data.stats).toHaveProperty('enrollmentProgress');
    });
  });

  describe('GET /api/admin/students/:userId/stats (Student Detailed Stats)', () => {
    it('should get detailed student statistics', async () => {
      const res = await request(app)
        .get(`/api/admin/students/${testUser._id.toString()}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('student');
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data.stats).toHaveProperty('totalEnrollments');
      expect(res.body.data.stats).toHaveProperty('completedCourses');
    });
  });
});

describe('Admin Authorization - RBAC', () => {
  let testAdmin;
  let testUser;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await connectTestDB();
    testAdmin = await seedTestAdmin({ email: 'rbacadmin@example.com' });
    testUser = await seedTestUser({ email: 'rbacuser@example.com' });
    adminToken = generateTestToken(testAdmin._id, 'admin');
    userToken = generateTestToken(testUser._id, 'user');
  });

  afterEach(async () => {
    await clearDatabase();
    testAdmin = await seedTestAdmin({ email: 'rbacadmin@example.com' });
    testUser = await seedTestUser({ email: 'rbacuser@example.com' });
    adminToken = generateTestToken(testAdmin._id, 'admin');
    userToken = generateTestToken(testUser._id, 'user');
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('should allow admin to access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  it('should block user from accessing admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/overview')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('should block unauthenticated access', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/overview');

    expect(res.statusCode).toBe(401);
  });

  it('should block invalid token', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/overview')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.statusCode).toBe(401);
  });
});

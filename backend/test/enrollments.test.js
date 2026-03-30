import request from 'supertest';
import express from 'express';
import enrollmentsRoutes from '../routes/enrollments.routes.js';
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
import Lesson from '../models/lesson.model.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/enrollments', enrollmentsRoutes);

describe('Enrollments Endpoints', () => {
  let testUser;
  let testAdmin;
  let userToken;
  let adminToken;
  let courseId;
  let lessonId;

  beforeAll(async () => {
    await connectTestDB();
    testUser = await seedTestUser({ email: 'student@example.com' });
    testAdmin = await seedTestAdmin({ email: 'admin@example.com' });
    userToken = generateTestToken(testUser._id, 'user');
    adminToken = generateTestToken(testAdmin._id, 'admin');

    // Create a course for testing
    const course = await Course.create({
      title: 'Test Course',
      description: 'Test course for enrollments',
      instructor: testAdmin._id,
      price: 29.99,
    });
    courseId = course._id;

    // Create a lesson
    const lesson = await Lesson.create({
      title: 'Lesson 1',
      description: 'First lesson',
      courseId,
      videoUrl: 'https://example.com/video.mp4',
    });
    lessonId = lesson._id;
  });

  afterEach(async () => {
    await clearDatabase();
    testUser = await seedTestUser({ email: 'student@example.com' });
    testAdmin = await seedTestAdmin({ email: 'admin@example.com' });

    const course = await Course.create({
      title: 'Test Course',
      description: 'Test course for enrollments',
      instructor: testAdmin._id,
      price: 29.99,
    });
    courseId = course._id;

    const lesson = await Lesson.create({
      title: 'Lesson 1',
      description: 'First lesson',
      courseId,
      videoUrl: 'https://example.com/video.mp4',
    });
    lessonId = lesson._id;
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('POST /api/enrollments/enroll (Enroll in Course)', () => {
    it('should enroll user in course successfully', async () => {
      const res = await request(app)
        .post('/api/enrollments/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: courseId.toString() });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(testUser._id.toString());
      expect(res.body.data.courseId).toBe(courseId.toString());

      const enrollment = await Enrollment.findOne({
        userId: testUser._id,
        courseId,
      });
      expect(enrollment).toBeDefined();
    });

    it('should reject enrollment without authentication', async () => {
      const res = await request(app)
        .post('/api/enrollments/enroll')
        .send({ courseId: courseId.toString() });

      expect(res.statusCode).toBe(401);
    });

    it('should reject duplicate enrollment', async () => {
      // First enrollment
      await request(app)
        .post('/api/enrollments/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: courseId.toString() });

      // Second enrollment attempt
      const res = await request(app)
        .post('/api/enrollments/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: courseId.toString() });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already enrolled');
    });

    it('should reject enrollment with nonexistent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post('/api/enrollments/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: fakeId });

      expect(res.statusCode).toBe(404);
    });

    it('should reject enrollment without courseId', async () => {
      const res = await request(app)
        .post('/api/enrollments/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/enrollments/my-enrollments (Get User Enrollments)', () => {
    beforeEach(async () => {
      // Enroll user in the course
      await request(app)
        .post('/api/enrollments/enroll')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId: courseId.toString() });
    });

    it('should get user enrollments', async () => {
      const res = await request(app)
        .get('/api/enrollments/my-enrollments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .get('/api/enrollments/my-enrollments');

      expect(res.statusCode).toBe(401);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/enrollments/my-enrollments')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('PUT /api/enrollments/:id/mark-complete (Mark Lesson Complete)', () => {
    let enrollmentId;

    beforeEach(async () => {
      const enrollment = await Enrollment.create({
        userId: testUser._id,
        courseId,
        enrollmentDate: new Date(),
        progress: 0,
        completedLessons: [],
      });
      enrollmentId = enrollment._id;
    });

    it('should mark lesson as complete', async () => {
      const res = await request(app)
        .put(`/api/enrollments/${enrollmentId.toString()}/mark-complete`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ lessonId: lessonId.toString() });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Enrollment.findById(enrollmentId);
      expect(updated.completedLessons).toContain(lessonId.toString());
    });

    it('should reject without authentication', async () => {
      const res = await request(app)
        .put(`/api/enrollments/${enrollmentId.toString()}/mark-complete`)
        .send({ lessonId: lessonId.toString() });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/enrollments/:id/progress (Update Progress)', () => {
    let enrollmentId;

    beforeEach(async () => {
      const enrollment = await Enrollment.create({
        userId: testUser._id,
        courseId,
        enrollmentDate: new Date(),
        progress: 0,
        completedLessons: [],
      });
      enrollmentId = enrollment._id;
    });

    it('should update enrollment progress', async () => {
      const res = await request(app)
        .put(`/api/enrollments/${enrollmentId.toString()}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ progress: 50 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.progress).toBe(50);
    });

    it('should reject invalid progress value', async () => {
      const res = await request(app)
        .put(`/api/enrollments/${enrollmentId.toString()}/progress`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ progress: 150 }); // Invalid: > 100

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/enrollments/:id (Unenroll)', () => {
    let enrollmentId;

    beforeEach(async () => {
      const enrollment = await Enrollment.create({
        userId: testUser._id,
        courseId,
        enrollmentDate: new Date(),
        progress: 0,
        completedLessons: [],
      });
      enrollmentId = enrollment._id;
    });

    it('should unenroll from course', async () => {
      const res = await request(app)
        .delete(`/api/enrollments/${enrollmentId.toString()}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);

      const enrollment = await Enrollment.findById(enrollmentId);
      expect(enrollment).toBeNull();
    });

    it('should reject unenroll without authentication', async () => {
      const res = await request(app)
        .delete(`/api/enrollments/${enrollmentId.toString()}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/enrollments/stats (Enrollment Stats)', () => {
    it('should get enrollment statistics', async () => {
      const res = await request(app)
        .get('/api/enrollments/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('totalEnrollments');
    });
  });
});

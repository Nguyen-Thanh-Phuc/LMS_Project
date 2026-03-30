import request from 'supertest';
import express from 'express';
import coursesRoutes from '../routes/courses.routes.js';
import {
  connectTestDB,
  disconnectTestDB,
  clearDatabase,
  seedTestUser,
  seedTestAdmin,
  generateTestToken,
} from './testHelper.js';
import Course from '../models/course.model.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/courses', coursesRoutes);

describe('Courses Endpoints', () => {
  let testUser;
  let testAdmin;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    await connectTestDB();
    testUser = await seedTestUser({ email: 'student@example.com' });
    testAdmin = await seedTestAdmin({ email: 'courseadmin@example.com' });
    userToken = generateTestToken(testUser._id, 'user');
    adminToken = generateTestToken(testAdmin._id, 'admin');
  });

  afterEach(async () => {
    await clearDatabase();
    testUser = await seedTestUser({ email: 'student@example.com' });
    testAdmin = await seedTestAdmin({ email: 'courseadmin@example.com' });
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('POST /api/courses (Create Course)', () => {
    it('should create course as admin', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'React Basics',
          description: 'Learn React fundamentals',
          price: 49.99,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('React Basics');

      const course = await Course.findById(res.body.data._id);
      expect(course).toBeDefined();
    });

    it('should reject course creation without authentication', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({
          title: 'React Basics',
          description: 'Learn React fundamentals',
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject course creation with incomplete data', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'React Basics',
          // missing description
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/courses (Get All Courses)', () => {
    beforeEach(async () => {
      // Create sample courses
      await Course.create({
        title: 'JavaScript Fundamentals',
        description: 'Learn JS basics',
        instructor: testAdmin._id,
        price: 29.99,
        isPublished: true,
      });
      await Course.create({
        title: 'Advanced JavaScript',
        description: 'Learn advanced JS concepts',
        instructor: testAdmin._id,
        price: 49.99,
        isPublished: false,
      });
    });

    it('should treat legacy course without isPublished as public', async () => {
      // reset one course to remove isPublished field
      await Course.updateOne({ title: 'JavaScript Fundamentals' }, { $unset: { isPublished: "" } });

      const res = await request(app)
        .get('/api/courses')
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should get all courses for admin', async () => {
      const res = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter courses by search term', async () => {
      const res = await request(app)
        .get('/api/courses')
        .query({ search: 'JavaScript' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toContain('JavaScript');
    });

    it('should sort courses by creation date', async () => {
      const res = await request(app)
        .get('/api/courses')
        .query({ sort: '-createdAt' });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const res = await request(app)
        .get('/api/courses')
        .query({ page: 1, limit: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/courses/:id (Get Single Course)', () => {
    let courseId;

    beforeEach(async () => {
      const course = await Course.create({
        title: 'Python Basics',
        description: 'Learn Python fundamentals',
        instructor: testAdmin._id,
        price: 39.99,
      });
      courseId = course._id;
    });

    it('should return 404 for unpublished course for public user', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}`);

      expect(res.statusCode).toBe(404);
    });

    it('should get unpublished course by id for admin', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(courseId.toString());
      expect(res.body.data.title).toBe('Python Basics');
    });

    it('should return 404 for nonexistent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/courses/${fakeId}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/courses/:id (Update Course)', () => {
    let courseId;

    beforeEach(async () => {
      const course = await Course.create({
        title: 'Original Title',
        description: 'Original description',
        instructor: testAdmin._id,
        price: 29.99,
      });
      courseId = course._id;
    });

    it('should update course as admin', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
          price: 39.99,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');

      const updatedCourse = await Course.findById(courseId);
      expect(updatedCourse.title).toBe('Updated Title');
    });

    it('should reject course update without authentication', async () => {
      const res = await request(app)
        .put(`/api/courses/${courseId}`)
        .send({
          title: 'Updated Title',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/courses/:id (Delete Course)', () => {
    let courseId;

    beforeEach(async () => {
      const course = await Course.create({
        title: 'To Be Deleted',
        description: 'This course will be deleted',
        instructor: testAdmin._id,
        price: 29.99,
      });
      courseId = course._id;
    });

    it('should delete course as admin', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);

      const deletedCourse = await Course.findById(courseId);
      expect(deletedCourse).toBeNull();
    });

    it('should reject delete without authentication', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/courses/:id/stats (Course Stats)', () => {
    let courseId;

    beforeEach(async () => {
      const course = await Course.create({
        title: 'Stats Test Course',
        description: 'Test course for stats',
        instructor: testAdmin._id,
        price: 29.99,
      });
      courseId = course._id;
    });

    it('should get course statistics', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('totalEnrollments');
    });
  });
});

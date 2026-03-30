import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes.js';
import {
  connectTestDB,
  disconnectTestDB,
  clearDatabase,
  seedTestUser,
  generateTestToken,
} from './testHelper.js';
import User from '../models/user.js';
import RefreshToken from '../models/refreshToken.model.js';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain('successfully');

      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          // missing name and password
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject registration with duplicate email', async () => {
      await seedTestUser({ email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
          password: 'Password123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await seedTestUser({
        email: 'testuser@example.com',
        name: 'Test User',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPassword123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('testuser@example.com');
    });

    it('should reject login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should save refresh token in database', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPassword123',
        });

      const refreshTokenInDb = await RefreshToken.findOne({
        token: res.body.refreshToken,
      });

      expect(refreshTokenInDb).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh access token successfully', async () => {
      const user = await seedTestUser();
      const refreshToken = generateTestToken(user._id);

      await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ requestToken: refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.accessToken).not.toBe(refreshToken);
    });

    it('should reject refresh with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ requestToken: 'invalid.token.here' });

      expect(res.statusCode).toBe(403);
    });

    it('should reject refresh without token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await seedTestUser();
      const token = generateTestToken(user._id);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('logged out');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await seedTestUser({ email: 'forgot@example.com' });
    });

    it('should send reset password email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('reset link');
    });

    it('should reject forgot-password for nonexistent user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const user = await seedTestUser({ email: 'reset@example.com' });
      
      // Generate a reset token (normally done by forgot-password endpoint)
      const resetToken = generateTestToken(user._id);
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123',
        });

      expect([200, 201]).toContain(res.statusCode);
    });
  });
});

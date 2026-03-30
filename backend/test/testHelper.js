import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import RefreshToken from '../models/refreshToken.model.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to test database
export const connectTestDB = async () => {
  try {
    const testDbUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/lms_test';
    await mongoose.connect(testDbUri, {
      // Mongoose 7+ no longer requires useNewUrlParser/useUnifiedTopology 
      // and these options are rejected by latest mongodb driver.
    });
    console.log('Test DB connected');
  } catch (error) {
    console.error('Test DB connection error:', error);
    throw error;
  }
};

// Disconnect from test database
export const disconnectTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    console.log('Test DB disconnected');
  } catch (error) {
    console.error('Test DB disconnection error:', error);
    throw error;
  }
};

// Clear all collections
export const clearDatabase = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Database clear error:', error);
  }
};

// Generate JWT token for testing
export const generateTestToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

// Generate refresh token
export const generateTestRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
    { expiresIn: '7d' }
  );
};

// Seed test user
export const seedTestUser = async (userData = {}) => {
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);
  
  const defaultUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: hashedPassword,
    role: 'user',
    ...userData,
  };

  const user = await User.create(defaultUser);
  return user;
};

// Seed test admin
export const seedTestAdmin = async (userData = {}) => {
  const hashedPassword = await bcrypt.hash('AdminPassword123', 10);
  
  const defaultAdmin = {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    ...userData,
  };

  const admin = await User.create(defaultAdmin);
  return admin;
};

// Seed test refresh token
export const seedTestRefreshToken = async (userId) => {
  const token = generateTestRefreshToken(userId);
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);

  const refreshToken = await RefreshToken.create({
    token,
    user: userId,
    expiryDate: expiredAt,
  });

  return { token, refreshToken };
};

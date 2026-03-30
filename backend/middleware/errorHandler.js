// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong MongoDB ID error
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Resource not found. Invalid: ${err.path}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    err.statusCode = 400;
    err.message = `Duplicate field value entered`;
  }

  // JWT Wrong Signature
  if (err.name === "JsonWebTokenError") {
    err.statusCode = 400;
    err.message = `Json Web Token is invalid, Try again`;
  }

  // JWT EXPIRE
  if (err.name === "TokenExpiredError") {
    err.statusCode = 400;
    err.message = `Json Web Token is expired, Try again`;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

// Async error wrapper to catch errors in async route handlers
export const catchAsyncErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

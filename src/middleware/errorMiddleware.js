import process from "process";
import { HTTP_STATUS } from '../utils/constants.js';

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    const message = 'Resource already exists';
    error = new AppError(message, HTTP_STATUS.CONFLICT);
  }

  // PostgreSQL foreign key constraint error
  if (err.code === '23503') {
    const message = 'Referenced resource not found';
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  // PostgreSQL check constraint error
  if (err.code === '23514') {
    const message = 'Invalid data provided';
    error = new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
  next(error);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

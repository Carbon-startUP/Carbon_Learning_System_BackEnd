import authService from '../services/authService.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { AppError } from './errorMiddleware.js';

export const authenticate = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.headers['x-session-token'] ||
                        req.cookies?.sessionToken;

    if (!sessionToken) {
      return next(new AppError('Access token required', HTTP_STATUS.UNAUTHORIZED));
    }

    const user = await authService.validateSession(sessionToken);
    
    if (!user) {
      return next(new AppError('Invalid or expired session', HTTP_STATUS.UNAUTHORIZED));
    }

    req.user = user;
    next();
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    next(new AppError('Authentication failed', HTTP_STATUS.UNAUTHORIZED));
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED));
    }

    const permissions = req.user.permissions || {};
    
    if (!permissions[permission]) {
      return next(new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN));
    }

    next();
  };
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED));
  }

  if (req.user.user_type_name !== 'admin') {
    return next(new AppError('Admin access required', HTTP_STATUS.FORBIDDEN));
  }

  next();
};
import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/login', authController.login);
// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);

// Admin only routes
router.post('/users', authenticate, requireAdmin, authController.createUser);
router.get('/user-types', authenticate, requireAdmin, authController.getUserTypes);

export default router;


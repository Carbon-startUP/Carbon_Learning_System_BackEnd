import { Router } from "express";
import authController from "../controllers/authController.js";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();
// Bulk operations
router.post('/bulk', authenticate, requireAdmin, authController.createBulkUsers);
router.delete('/bulk', authenticate, requireAdmin, authController.deleteBulkUsers);

// Admin only routes for user management
router.get('/', authenticate, requireAdmin, authController.getAllUsers);
router.get('/:id', authenticate, requireAdmin, authController.getUserById);
router.patch('/:id', authenticate, requireAdmin, authController.updateUser);
router.delete('/:id', authenticate, requireAdmin, authController.deleteUser);


export default router;

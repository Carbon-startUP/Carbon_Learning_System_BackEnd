import { Router } from 'express';
import schoolController from '../controllers/schoolController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All school routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// School CRUD operations
router.post('/', schoolController.createSchool);
router.get('/', schoolController.getAllSchools);
router.get('/stats/with-counts', schoolController.getSchoolsWithStudentCounts);
router.get('/:id', schoolController.getSchoolById);
router.patch('/:id', schoolController.updateSchool);
router.delete('/:id', schoolController.deleteSchool);

// School-specific operations
router.get('/:id/students', schoolController.getStudentsBySchool);

export default router;
import { Router } from 'express';
import courseController from '../controllers/courseController.js';
import { authenticate, requireAdmin, requirePermission } from '../middleware/authMiddleware.js';

const router = Router();

// All course routes require authentication
router.use(authenticate);

// Admin routes - Course management
router.post('/', requireAdmin, courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.patch('/:id', requireAdmin, courseController.updateCourse);
router.delete('/:id', requireAdmin, courseController.deleteCourse);

// Enrollment management (Admin and Teachers)
router.post('/:courseId/enroll', requirePermission('can_manage_enrollments'), courseController.enrollStudent);
router.get('/:courseId/enrollments', requirePermission('can_view_enrollments'), courseController.getEnrollmentsByCourse);
router.delete('/:courseId/enrollments/:studentId', requirePermission('can_manage_enrollments'), courseController.dropEnrollment);

// Schedule management (Admin and Teachers)
router.post('/schedules', requirePermission('can_manage_schedules'), courseController.createSchedule);
router.get('/:courseId/schedules', courseController.getCourseSchedules);
router.patch('/schedules/:id', requirePermission('can_manage_schedules'), courseController.updateSchedule);
router.delete('/schedules/:id', requirePermission('can_manage_schedules'), courseController.deleteSchedule);

// Session management (Admin and Teachers)
router.post('/sessions', requirePermission('can_manage_sessions'), courseController.createSession);
router.get('/:courseId/sessions', courseController.getCourseSessions);
router.patch('/sessions/:id', requirePermission('can_manage_sessions'), courseController.updateSession);

// Student-specific routes
router.get('/student/my-courses', courseController.getStudentCourses);
router.get('/student/upcoming-sessions', courseController.getStudentUpcomingSessions);
router.get('/student/weekly-schedule', courseController.getStudentWeeklySchedule);

// Parent-specific routes  
router.get('/parent/children-courses', courseController.getChildrenCourses);

// Teacher-specific routes
router.get('/teacher/my-courses', courseController.getTeacherCourses);
router.get('/teacher/upcoming-sessions', courseController.getTeacherUpcomingSessions);

export default router;
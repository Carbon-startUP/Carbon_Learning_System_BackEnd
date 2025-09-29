import { asyncHandler } from '../middleware/errorMiddleware.js';
import { HTTP_STATUS } from '../utils/constants.js';
import courseService from '../services/courseService.js';

class CourseController {
  // Course CRUD operations
  createCourse = asyncHandler(async (req, res) => {
    const courseData = req.body;
    const createdBy = req.user.id;

    const newCourse = await courseService.createCourse(courseData, createdBy);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course: newCourse
      }
    });
  });

  getAllCourses = asyncHandler(async (req, res) => {
    const { 
      page = 1, limit = 10, search, subject, gradeLevel, schoolId, status 
    } = req.query;

    const filters = {
      search: search || null,
      subject: subject || null,
      gradeLevel: gradeLevel || null,
      schoolId: schoolId || null,
      status: status || null
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await courseService.getAllCourses(filters, pagination);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await courseService.getCourseById(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        course
      }
    });
  });

  updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const courseData = req.body;

    const updatedCourse = await courseService.updateCourse(id, courseData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course: updatedCourse
      }
    });
  });

  deleteCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await courseService.deleteCourse(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course deleted successfully'
    });
  });

  // Enrollment operations
  enrollStudent = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { studentId } = req.body;

    const enrollment = await courseService.enrollStudent(courseId, studentId);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Student enrolled successfully',
      data: {
        enrollment
      }
    });
  });

  getEnrollmentsByCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const enrollments = await courseService.getEnrollmentsByCourse(courseId, pagination);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        enrollments,
        pagination
      }
    });
  });

  dropEnrollment = asyncHandler(async (req, res) => {
    const { courseId, studentId } = req.params;

    await courseService.dropEnrollment(courseId, studentId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Student dropped from course successfully'
    });
  });

  // Schedule operations
  createSchedule = asyncHandler(async (req, res) => {
    const scheduleData = req.body;

    const newSchedule = await courseService.createSchedule(scheduleData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        schedule: newSchedule
      }
    });
  });

  getCourseSchedules = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const schedules = await courseService.getCourseSchedules(courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        schedules
      }
    });
  });

  updateSchedule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const scheduleData = req.body;

    const updatedSchedule = await courseService.updateSchedule(id, scheduleData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        schedule: updatedSchedule
      }
    });
  });

  deleteSchedule = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await courseService.deleteSchedule(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  });

  // Session operations
  createSession = asyncHandler(async (req, res) => {
    const sessionData = req.body;

    const newSession = await courseService.createSession(sessionData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Session created successfully',
      data: {
        session: newSession
      }
    });
  });

  getCourseSessions = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const filters = {
      startDate: startDate || null,
      endDate: endDate || null
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const sessions = await courseService.getCourseSessions(courseId, filters, pagination);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        sessions,
        pagination
      }
    });
  });

  updateSession = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sessionData = req.body;

    const updatedSession = await courseService.updateSession(id, sessionData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Session updated successfully',
      data: {
        session: updatedSession
      }
    });
  });

  // Student dashboard endpoints
  getStudentCourses = asyncHandler(async (req, res) => {
    const studentId = req.user.id;

    const courses = await courseService.getStudentCourses(studentId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        courses
      }
    });
  });

  getStudentUpcomingSessions = asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    const { limit = 10 } = req.query;

    const sessions = await courseService.getStudentUpcomingSessions(studentId, parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        sessions
      }
    });
  });

  getStudentWeeklySchedule = asyncHandler(async (req, res) => {
    const studentId = req.user.id;

    const schedule = await courseService.getStudentWeeklySchedule(studentId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        schedule
      }
    });
  });

  // Parent dashboard endpoints
  getChildrenCourses = asyncHandler(async (req, res) => {
    const parentId = req.user.id;

    const courses = await courseService.getChildrenCourses(parentId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        courses
      }
    });
  });

  // Teacher dashboard endpoints
  getTeacherCourses = asyncHandler(async (req, res) => {
    const teacherId = req.user.id;

    const courses = await courseService.getTeacherCourses(teacherId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        courses
      }
    });
  });

  getTeacherUpcomingSessions = asyncHandler(async (req, res) => {
    const teacherId = req.user.id;
    const { limit = 10 } = req.query;

    const sessions = await courseService.getTeacherUpcomingSessions(teacherId, parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        sessions
      }
    });
  });
}

export default new CourseController();
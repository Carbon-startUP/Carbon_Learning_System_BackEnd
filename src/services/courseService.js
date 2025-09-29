import { pool } from '../config/database.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { AppError } from '../middleware/errorMiddleware.js';
import courseQueries from '../database/queries/courseQueries.js';

class CourseService {
  // Course CRUD operations
  async createCourse(courseData, createdBy) {
    const { 
      name, description, code, subject, gradeLevel, credits, maxStudents, 
      schoolId, teacherId, startDate, endDate 
    } = courseData;

    // Check if course code already exists
    const existingCourse = await pool.query(courseQueries.checkCourseCodeExists, [code, null]);
    if (existingCourse.rows.length > 0) {
      throw new AppError('Course code already exists', HTTP_STATUS.CONFLICT);
    }

    const result = await pool.query(courseQueries.createCourse, [
      name, description, code, subject, gradeLevel, credits, maxStudents, 
      schoolId, teacherId, startDate, endDate, createdBy
    ]);

    return result.rows[0];
  }

  async getAllCourses(filters, pagination) {
    const { search, subject, gradeLevel, schoolId, status } = filters;
    const { page, limit } = pagination;

    const params = [
      search || null,
      subject || null,
      gradeLevel || null,
      schoolId || null,
      status || null,
      limit,
      (page - 1) * limit
    ];

    const [coursesResult, countResult] = await Promise.all([
      pool.query(courseQueries.getAllCourses, params),
      pool.query(courseQueries.getCoursesCount, params.slice(0, 5))
    ]);

    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      courses: coursesResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async getCourseById(id) {
    const result = await pool.query(courseQueries.getCourseById, [id]);
    
    if (result.rows.length === 0) {
      throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    return result.rows[0];
  }

  async updateCourse(id, courseData) {
    const { 
      name, description, subject, gradeLevel, credits, maxStudents, 
      teacherId, startDate, endDate, status 
    } = courseData;

    // Check if course exists
    const existingCourse = await pool.query(courseQueries.getCourseById, [id]);
    if (existingCourse.rows.length === 0) {
      throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    const course = existingCourse.rows[0];

    const result = await pool.query(courseQueries.updateCourse, [
      name || course.name,
      description || course.description,
      subject || course.subject,
      gradeLevel || course.grade_level,
      credits || course.credits,
      maxStudents || course.max_students,
      teacherId || course.teacher_id,
      startDate || course.start_date,
      endDate || course.end_date,
      status || course.status,
      id
    ]);

    return result.rows[0];
  }

  async deleteCourse(id) {
    const existingCourse = await pool.query(courseQueries.getCourseById, [id]);
    if (existingCourse.rows.length === 0) {
      throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    await pool.query(courseQueries.deleteCourse, [id]);
  }

  // Enrollment operations
  async enrollStudent(courseId, studentId) {
    // Check if course exists and has space
    const course = await this.getCourseById(courseId);
    
    if (course.enrolled_students >= course.max_students) {
      throw new AppError('Course is full', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await pool.query(courseQueries.enrollStudent, [courseId, studentId]);
    return result.rows[0];
  }

  async getEnrollmentsByCourse(courseId, pagination) {
    const { page, limit } = pagination;

    const result = await pool.query(courseQueries.getEnrollmentsByCourse, [
      courseId,
      limit,
      (page - 1) * limit
    ]);

    return result.rows;
  }

  async getEnrollmentsByStudent(studentId) {
    const result = await pool.query(courseQueries.getEnrollmentsByStudent, [studentId]);
    return result.rows;
  }

  async dropEnrollment(courseId, studentId) {
    await pool.query(courseQueries.dropEnrollment, [courseId, studentId]);
  }

  // Schedule operations
  async createSchedule(scheduleData) {
    const { courseId, dayOfWeek, startTime, endTime, room, building } = scheduleData;

    const result = await pool.query(courseQueries.createSchedule, [
      courseId, dayOfWeek, startTime, endTime, room, building
    ]);

    return result.rows[0];
  }

  async getCourseSchedules(courseId) {
    const result = await pool.query(courseQueries.getCourseSchedules, [courseId]);
    return result.rows;
  }

  async updateSchedule(id, scheduleData) {
    const { dayOfWeek, startTime, endTime, room, building } = scheduleData;

    const result = await pool.query(courseQueries.updateSchedule, [
      dayOfWeek, startTime, endTime, room, building, id
    ]);

    if (result.rows.length === 0) {
      throw new AppError('Schedule not found', HTTP_STATUS.NOT_FOUND);
    }

    return result.rows[0];
  }

  async deleteSchedule(id) {
    await pool.query(courseQueries.deleteSchedule, [id]);
  }

  // Session operations
  async createSession(sessionData) {
    const { courseId, sessionDate, startTime, endTime, topic, description, room, building } = sessionData;

    const result = await pool.query(courseQueries.createSession, [
      courseId, sessionDate, startTime, endTime, topic, description, room, building
    ]);

    return result.rows[0];
  }

  async getCourseSessions(courseId, filters, pagination) {
    const { startDate, endDate } = filters;
    const { page, limit } = pagination;

    const result = await pool.query(courseQueries.getCourseSessions, [
      courseId,
      startDate || null,
      endDate || null,
      limit,
      (page - 1) * limit
    ]);

    return result.rows;
  }

  async updateSession(id, sessionData) {
    const { sessionDate, startTime, endTime, topic, description, room, building, status } = sessionData;

    const result = await pool.query(courseQueries.updateSession, [
      sessionDate, startTime, endTime, topic, description, room, building, status, id
    ]);

    if (result.rows.length === 0) {
      throw new AppError('Session not found', HTTP_STATUS.NOT_FOUND);
    }

    return result.rows[0];
  }

  // Student dashboard services
  async getStudentCourses(studentId) {
    const result = await pool.query(courseQueries.getStudentCourses, [studentId]);
    return result.rows;
  }

  async getStudentUpcomingSessions(studentId, limit = 10) {
    const result = await pool.query(courseQueries.getStudentUpcomingSessions, [studentId, limit]);
    return result.rows;
  }

  async getStudentWeeklySchedule(studentId) {
    const result = await pool.query(courseQueries.getStudentWeeklySchedule, [studentId]);
    return result.rows;
  }

  // Parent dashboard services
  async getChildrenCourses(parentId) {
    const result = await pool.query(courseQueries.getChildrenCourses, [parentId]);
    return result.rows;
  }

  // Teacher dashboard services
  async getTeacherCourses(teacherId) {
    const result = await pool.query(courseQueries.getTeacherCourses, [teacherId]);
    return result.rows;
  }

  async getTeacherUpcomingSessions(teacherId, limit = 10) {
    const result = await pool.query(courseQueries.getTeacherUpcomingSessions, [teacherId, limit]);
    return result.rows;
  }
}

export default new CourseService();
const courseQueries = {
  // Course CRUD operations
  createCourse: `--sql
    INSERT INTO courses (name, description, code, subject, grade_level, credits, max_students, school_id, teacher_id, start_date, end_date, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `,

  getAllCourses: `--sql
    SELECT c.*, s.name as school_name, u.full_name as teacher_name,
           COUNT(ce.id) as enrolled_students
    FROM courses c
    LEFT JOIN schools s ON c.school_id = s.id
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.active = true AND ce.status = 'enrolled'
    WHERE c.active = true
    AND ($1::text IS NULL OR c.name ILIKE '%' || $1 || '%' OR c.code ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR c.subject = $2)
    AND ($3::text IS NULL OR c.grade_level = $3)
    AND ($4::uuid IS NULL OR c.school_id = $4)
    AND ($5::text IS NULL OR c.status = $5)
    GROUP BY c.id, s.name, u.full_name
    ORDER BY c.name ASC
    LIMIT $6 OFFSET $7
  `,

  getCoursesCount: `--sql
    SELECT COUNT(*) as total FROM courses c
    WHERE c.active = true
    AND ($1::text IS NULL OR c.name ILIKE '%' || $1 || '%' OR c.code ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR c.subject = $2)
    AND ($3::text IS NULL OR c.grade_level = $3)
    AND ($4::uuid IS NULL OR c.school_id = $4)
    AND ($5::text IS NULL OR c.status = $5)
  `,

  getCourseById: `--sql
    SELECT c.*, s.name as school_name, u.full_name as teacher_name,
           COUNT(ce.id) as enrolled_students
    FROM courses c
    LEFT JOIN schools s ON c.school_id = s.id
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.active = true AND ce.status = 'enrolled'
    WHERE c.id = $1 AND c.active = true
    GROUP BY c.id, s.name, u.full_name
  `,

  updateCourse: `--sql
    UPDATE courses 
    SET name = $1, description = $2, subject = $3, grade_level = $4, credits = $5, 
        max_students = $6, teacher_id = $7, start_date = $8, end_date = $9, status = $10
    WHERE id = $11 AND active = true
    RETURNING *
  `,

  deleteCourse: `--sql
    UPDATE courses SET active = false WHERE id = $1
  `,

  checkCourseCodeExists: `--sql
    SELECT id FROM courses WHERE code = $1 AND active = true AND id != COALESCE($2, '00000000-0000-0000-0000-000000000000'::uuid)
  `,

  // Course enrollment operations
  enrollStudent: `--sql
    INSERT INTO course_enrollments (course_id, student_id, status)
    VALUES ($1, $2, 'enrolled')
    ON CONFLICT (course_id, student_id) 
    DO UPDATE SET status = 'enrolled', active = true, enrollment_date = CURRENT_TIMESTAMP
    RETURNING *
  `,

  getEnrollmentsByCourse: `--sql
    SELECT ce.*, u.full_name as student_name, u.username as student_username
    FROM course_enrollments ce
    JOIN users u ON ce.student_id = u.id
    WHERE ce.course_id = $1 AND ce.active = true
    ORDER BY u.full_name ASC
    LIMIT $2 OFFSET $3
  `,

  getEnrollmentsByStudent: `--sql
    SELECT ce.*, c.name as course_name, c.code as course_code, c.subject, c.grade_level,
           u.full_name as teacher_name
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE ce.student_id = $1 AND ce.active = true AND c.active = true
    ORDER BY c.name ASC
  `,

  dropEnrollment: `--sql
    UPDATE course_enrollments 
    SET status = 'dropped', active = false 
    WHERE course_id = $1 AND student_id = $2
  `,

  // Course schedule operations
  createSchedule: `--sql
    INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, room, building)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,

  getCourseSchedules: `--sql
    SELECT * FROM course_schedules 
    WHERE course_id = $1 AND active = true
    ORDER BY day_of_week, start_time
  `,

  updateSchedule: `--sql
    UPDATE course_schedules 
    SET day_of_week = $1, start_time = $2, end_time = $3, room = $4, building = $5
    WHERE id = $6 AND active = true
    RETURNING *
  `,

  deleteSchedule: `--sql
    UPDATE course_schedules SET active = false WHERE id = $1
  `,

  // Course sessions operations
  createSession: `--sql
    INSERT INTO course_sessions (course_id, session_date, start_time, end_time, topic, description, room, building)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `,

  getCourseSessions: `--sql
    SELECT * FROM course_sessions 
    WHERE course_id = $1 
    AND ($2::date IS NULL OR session_date >= $2)
    AND ($3::date IS NULL OR session_date <= $3)
    ORDER BY session_date ASC, start_time ASC
    LIMIT $4 OFFSET $5
  `,

  updateSession: `--sql
    UPDATE course_sessions 
    SET session_date = $1, start_time = $2, end_time = $3, topic = $4, description = $5, 
        room = $6, building = $7, status = $8
    WHERE id = $9
    RETURNING *
  `,

  // Student dashboard queries
  getStudentCourses: `--sql
    SELECT c.*, ce.enrollment_date, ce.status as enrollment_status,
           u.full_name as teacher_name, s.name as school_name
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN schools s ON c.school_id = s.id
    WHERE ce.student_id = $1 AND ce.active = true AND c.active = true
    ORDER BY c.name ASC
  `,

  getStudentUpcomingSessions: `--sql
    SELECT cs.*, c.name as course_name, c.code as course_code
    FROM course_sessions cs
    JOIN courses c ON cs.course_id = c.id
    JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE ce.student_id = $1 AND ce.active = true AND ce.status = 'enrolled'
    AND cs.session_date >= CURRENT_DATE
    AND cs.status = 'scheduled'
    ORDER BY cs.session_date ASC, cs.start_time ASC
    LIMIT $2
  `,

  getStudentWeeklySchedule: `--sql
    SELECT cs.*, c.name as course_name, c.code as course_code, c.subject
    FROM course_schedules cs
    JOIN courses c ON cs.course_id = c.id
    JOIN course_enrollments ce ON c.id = ce.course_id
    WHERE ce.student_id = $1 AND ce.active = true AND ce.status = 'enrolled'
    AND cs.active = true AND c.active = true
    ORDER BY cs.day_of_week ASC, cs.start_time ASC
  `,

  // Parent dashboard queries
  getChildrenCourses: `--sql
    SELECT c.*, ce.enrollment_date, ce.status as enrollment_status, ce.attendance_percentage,
           u.full_name as teacher_name, s.name as school_name, child.full_name as child_name
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    JOIN users child ON ce.student_id = child.id
    JOIN child_metadata cm ON child.child_metadata_id = cm.id
    LEFT JOIN users u ON c.teacher_id = u.id
    LEFT JOIN schools s ON c.school_id = s.id
    WHERE cm.parent_id = $1 AND ce.active = true AND c.active = true
    ORDER BY child.full_name ASC, c.name ASC
  `,

  // Teacher dashboard queries
  getTeacherCourses: `--sql
    SELECT c.*, COUNT(ce.id) as enrolled_students, s.name as school_name
    FROM courses c
    LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.active = true AND ce.status = 'enrolled'
    LEFT JOIN schools s ON c.school_id = s.id
    WHERE c.teacher_id = $1 AND c.active = true
    GROUP BY c.id, s.name
    ORDER BY c.name ASC
  `,

  getTeacherUpcomingSessions: `--sql
    SELECT cs.*, c.name as course_name, c.code as course_code
    FROM course_sessions cs
    JOIN courses c ON cs.course_id = c.id
    WHERE c.teacher_id = $1 AND cs.session_date >= CURRENT_DATE
    AND cs.status = 'scheduled'
    ORDER BY cs.session_date ASC, cs.start_time ASC
    LIMIT $2
  `
};

export default courseQueries;
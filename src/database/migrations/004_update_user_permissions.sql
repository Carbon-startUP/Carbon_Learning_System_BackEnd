-- Update user types with course management permissions
UPDATE user_types 
SET permissions = permissions || '{"can_manage_enrollments": true, "can_manage_schedules": true, "can_manage_sessions": true, "can_view_enrollments": true}'::jsonb
WHERE name = 'admin';

UPDATE user_types 
SET permissions = permissions || '{"can_manage_enrollments": true, "can_manage_schedules": true, "can_manage_sessions": true, "can_view_enrollments": true, "can_create_courses": true, "can_grade_students": true}'::jsonb
WHERE name = 'teacher';

UPDATE user_types 
SET permissions = permissions || '{"can_enroll_courses": true, "can_submit_assignments": true, "can_view_grades": true}'::jsonb
WHERE name = 'student';

UPDATE user_types 
SET permissions = permissions || '{"can_view_grades": true, "can_communicate_with_teachers": true, "can_monitor_progress": true, "can_view_enrollments": true}'::jsonb
WHERE name = 'parent';
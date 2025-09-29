const schoolQueries = {
  // Create a new school
  createSchool: `--sql
    INSERT INTO schools (name, address, phone, email, website, principal_name, school_type, grade_levels, capacity)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `,

  // Get all schools with pagination and filters
  getAllSchools: `--sql
    SELECT * FROM schools 
    WHERE active = true
    AND ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR school_type = $2)
    ORDER BY name ASC
    LIMIT $3 OFFSET $4
  `,

  // Get schools count for pagination
  getSchoolsCount: `--sql
    SELECT COUNT(*) as total FROM schools 
    WHERE active = true
    AND ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
    AND ($2::text IS NULL OR school_type = $2)
  `,

  // Get school by ID
  getSchoolById: `--sql
    SELECT * FROM schools WHERE id = $1 AND active = true
  `,

  // Update school
  updateSchool: `--sql
    UPDATE schools 
    SET name = $1, address = $2, phone = $3, email = $4, website = $5, 
        principal_name = $6, school_type = $7, grade_levels = $8, capacity = $9
    WHERE id = $10 AND active = true
    RETURNING *
  `,

  // Soft delete school
  deleteSchool: `--sql
    UPDATE schools SET active = false WHERE id = $1
  `,

  // Get school with student count
  getSchoolWithStudentCount: `--sql
    SELECT s.*, COUNT(cm.id) as student_count
    FROM schools s
    LEFT JOIN child_metadata cm ON s.id = cm.school_id
    WHERE s.active = true
    GROUP BY s.id
    ORDER BY s.name ASC
  `,

  // Get students by school
  getStudentsBySchool: `--sql
    SELECT u.id, u.username, u.full_name, u.created_at
    FROM users u
    JOIN child_metadata cm ON u.child_metadata_id = cm.id
    WHERE cm.school_id = $1 AND u.active = true
    ORDER BY u.full_name ASC
    LIMIT $2 OFFSET $3
  `,

  // Check if school name exists (for validation)
  checkSchoolNameExists: `--sql
    SELECT id FROM schools WHERE name = $1 AND active = true AND id != COALESCE($2, '00000000-0000-0000-0000-000000000000'::uuid)
  `
};

export default schoolQueries;
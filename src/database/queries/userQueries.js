// File: /home/hqnw/Desktop/work/carbon/Carbon_Learning_System_BackEnd/src/database/queries/authQueries.js

//// $1: search (text)
//// $2: userType (integer)
//// $3: isActive (boolean)
//// $4: createdFrom (timestamp)
//// $5: sortBy (text)
//// $6: sortOrder (text)
//// $7: limit (integer)
//// $8: offset (integer)
const userqueries = {
  userQueries: {
    createUser: `--sql
    INSERT INTO users (username, password_hash, first_name, last_name, phone, user_type_id, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `,
    getUserById: `--sql
    SELECT * FROM users WHERE id = $1 AND deleted = false
  `,
    getAllUsers: `--sql
    SELECT * FROM users WHERE deleted = false
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `,
    getAllUsersWithFilters: `--sql
    SELECT * FROM users 
    WHERE deleted = false
    AND ($1::text IS NULL OR (
      username ILIKE '%' || $1 || '%' OR 
      first_name ILIKE '%' || $1 || '%' OR 
      last_name ILIKE '%' || $1 || '%'
    ))
    AND ($2::integer IS NULL OR user_type_id = $2)
    AND ($3::boolean IS NULL OR active = $3)
    AND ($4::timestamp IS NULL OR created_at >= $4)
    ORDER BY 
      CASE WHEN $6 = 'asc' THEN
        CASE WHEN $5 = 'username' THEN username END
      END ASC,
      CASE WHEN $6 = 'asc' THEN
        CASE WHEN $5 = 'created_at' THEN created_at END
      END ASC,
      CASE WHEN $6 = 'desc' THEN
        CASE WHEN $5 = 'username' THEN username END
      END DESC,
      CASE WHEN $6 = 'desc' THEN
        CASE WHEN $5 = 'created_at' THEN created_at END
      END DESC,
      created_at DESC
    LIMIT $7 OFFSET $8
  `,
    getUsersCount: `--sql
    SELECT COUNT(*) as total FROM users WHERE deleted = false
  `,
    getUsersCountWithFilters: `--sql
    SELECT COUNT(*) as total FROM users 
    WHERE deleted = false
    AND ($1::text IS NULL OR (
      username ILIKE '%' || $1 || '%' OR 
      first_name ILIKE '%' || $1 || '%' OR 
      last_name ILIKE '%' || '%'
    ))
    AND ($2::integer IS NULL OR user_type_id = $2)
    AND ($3::boolean IS NULL OR active = $3)
    AND ($4::timestamp IS NULL OR created_at >= $4)
  `,
    getUserByUsername: `--sql
    SELECT * FROM users WHERE username = $1 AND deleted = false
  `,
    updateUser: `--sql
    UPDATE users SET username = $1, first_name = $2, last_name = $3, phone = $4, user_type_id = $5
    WHERE id = $6 AND deleted = false
  `,
    deleteUser: `--sql
    UPDATE users SET deleted = true WHERE id = $1
  `
  },

  sessionQueries: {
    createSession: `--sql
    INSERT INTO user_sessions (user_id, session_token, expires_at)
    VALUES ($1, $2, $3)
  `,
    getSession: `--sql
    SELECT * FROM user_sessions WHERE session_token = $1
  `,
    getUserSessions: `--sql
    SELECT * FROM user_sessions WHERE user_id = $1
  `,
    getAllSessions: `--sql
    SELECT * FROM user_sessions 
    WHERE ($1::integer IS NULL OR user_id = $1)
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,
    getSessionsCount: `--sql
    SELECT COUNT(*) as total FROM user_sessions
    WHERE ($1::integer IS NULL OR user_id = $1)
  `,
    deleteSession: `--sql
    DELETE FROM user_sessions WHERE session_token = $1
  `,
    deleteUserSessions: `--sql
    DELETE FROM user_sessions WHERE user_id = $1
  `,
    cleanExpiredSessions: `--sql
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP
  `,
    updateLastAccessed: `--sql
    UPDATE user_sessions 
    SET last_accessed = CURRENT_TIMESTAMP 
    WHERE session_token = $1
  `
  },

  userTypeQueries: {
    getUserTypes: `--sql
    SELECT id, name, description, permissions FROM user_types 
    ORDER BY name
    LIMIT $1 OFFSET $2
  `,
    getUserTypesCount: `--sql
    SELECT COUNT(*) as total FROM user_types
  `,
    getUserTypeById: `--sql
    SELECT id FROM user_types WHERE name = $1
  `,
    getUserWithType: `--sql
    SELECT u.*, ut.name as user_type_name, ut.permissions
    FROM users u
    JOIN user_types ut ON u.user_type_id = ut.id
    WHERE u.id = $1 AND u.active = true
  `,
    getUserWithTypeByUsername: `--sql
    SELECT u.*, ut.name as user_type_name, ut.permissions
    FROM users u
    JOIN user_types ut ON u.user_type_id = ut.id
    WHERE (u.username = $1) AND u.active = true
  `
  },

  authSecurityQueries: {
    getUserLockInfo: `--sql
    SELECT locked_until, failed_login_attempts 
    FROM users 
    WHERE id = $1
  `,
    incrementFailedAttempts: `--sql
    UPDATE users 
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = $1
    RETURNING failed_login_attempts
  `,
    lockUser: `--sql
    UPDATE users 
    SET locked_until = $1 
    WHERE id = $2
  `,
    resetLoginAttempts: `--sql
    UPDATE users 
    SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP
    WHERE id = $1
  `,
    checkUserExists: `--sql
    SELECT id FROM users WHERE username = $1
  `
  },
}

export default userqueries;
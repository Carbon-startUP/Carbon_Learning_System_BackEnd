-- Create user_types table
CREATE TABLE IF NOT EXISTS user_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default user types
INSERT INTO user_types (name, description, permissions) VALUES
('admin', 'Administrator with full access', '{"can_create_users": true, "can_delete_users": true, "can_manage_system": true}'),
('teacher', 'Teacher with course management access', '{"can_create_courses": true, "can_grade_students": true}'),
('student', 'Student with learning access', '{"can_enroll_courses": true, "can_submit_assignments": true}'),
('parent', 'Parent with student monitoring access', '{"can_view_grades": true, "can_communicate_with_teachers": true, "can_monitor_progress": true}')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_types
CREATE TRIGGER update_user_types_updated_at 
    BEFORE UPDATE ON user_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TYPE gender AS ENUM ('male', 'female', 'other');

CREATE TABLE parent_metadata (
    id UUID PRIMARY KEY,
    email TEXT,
    cardIdNumber VARCHAR(14),
    phoneNumber VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE health_metadata (
    id UUID PRIMARY KEY,
    height DECIMAL(5, 2),
    weight DECIMAL(5, 2),
    blood_type VARCHAR(3),
    allergies TEXT,
    chronicConditions TEXT,
    currentMedications TEXT,
    emergencyContact TEXT,
    emergencyContactPhone VARCHAR(20),
    lastCheckupDate TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE child_metadata (
    id UUID PRIMARY KEY,
    health_metadata_id UUID REFERENCES health_metadata(id) ON DELETE SET NULL,
    schoolName VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender gender,
    user_type_id INTEGER NOT NULL REFERENCES user_types(id) ON DELETE RESTRICT,
    parent_metadata_id UUID REFERENCES parent_metadata(id) ON DELETE SET NULL,
    child_metadata_id UUID REFERENCES child_metadata(id) ON DELETE SET NULL,
    CONSTRAINT check_metadata_exclusive CHECK (
        (parent_metadata_id IS NOT NULL AND child_metadata_id IS NULL) OR
        (parent_metadata_id IS NULL AND child_metadata_id IS NOT NULL) OR
        (parent_metadata_id IS NULL AND child_metadata_id IS NULL)
    ),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);


ALTER TABLE child_metadata
    ADD COLUMN parent_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type_id ON users(user_type_id);
CREATE INDEX idx_users_active ON users(active);

-- Create trigger for users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sessions table for Redis session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);



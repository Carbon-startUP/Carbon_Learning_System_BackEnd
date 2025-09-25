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
('student', 'Student with learning access', '{"can_enroll_courses": true, "can_submit_assignments": true}')
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
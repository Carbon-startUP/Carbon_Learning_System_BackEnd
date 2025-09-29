-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    principal_name VARCHAR(100),
    school_type VARCHAR(50) CHECK (school_type IN ('public', 'private', 'charter', 'international')),
    grade_levels VARCHAR(50), -- e.g., "K-12", "1-6", "7-12"
    capacity INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for schools
CREATE INDEX idx_schools_name ON schools(name);
CREATE INDEX idx_schools_active ON schools(active);
CREATE INDEX idx_schools_type ON schools(school_type);

-- Create trigger for schools updated_at
CREATE TRIGGER update_schools_updated_at 
    BEFORE UPDATE ON schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add school_id foreign key to child_metadata table
ALTER TABLE child_metadata 
ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX idx_child_metadata_school_id ON child_metadata(school_id);

-- Optional: Migrate existing schoolName data to schools table
-- This will create school records from existing schoolName values in child_metadata
INSERT INTO schools (name)
SELECT DISTINCT schoolName 
FROM child_metadata 
WHERE schoolName IS NOT NULL AND schoolName != ''
ON CONFLICT (name) DO NOTHING;

-- Update child_metadata to reference the new school records
UPDATE child_metadata 
SET school_id = (
    SELECT s.id 
    FROM schools s 
    WHERE s.name = child_metadata.schoolName
)
WHERE schoolName IS NOT NULL AND schoolName != '';

-- Optional: Remove the old schoolName column after migration
-- Uncomment the following line if you want to completely remove the old column
-- ALTER TABLE child_metadata DROP COLUMN schoolName;
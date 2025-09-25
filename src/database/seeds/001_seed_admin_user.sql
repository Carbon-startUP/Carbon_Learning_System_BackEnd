-- Insert default admin user (password: admin123)
-- This is a hashed version of 'admin123' using argon2
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    user_type_id
) 
SELECT 
    'admin',
    'admin@carbon.com',
    '$argon2id$v=19$m=65536,t=3,p=4$qwertyuiopasdfghjklzxcvbnm1234567890$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'System',
    'Administrator',
    ut.id
FROM user_types ut 
WHERE ut.name = 'admin'
ON CONFLICT (username) DO NOTHING;
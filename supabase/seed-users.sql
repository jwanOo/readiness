-- ═══════════════════════════════════════════════════════════════
-- AI READINESS CHECK - SEED USERS
-- Run this SQL in your Supabase SQL Editor to create test users
-- ═══════════════════════════════════════════════════════════════

-- IMPORTANT: In Supabase, user authentication is handled by the auth.users table
-- Passwords are securely hashed and cannot be stored in plain text in profiles
-- 
-- To add users, you have TWO options:

-- ═══════════════════════════════════════════════════════════════
-- OPTION 1: Use Supabase Dashboard (RECOMMENDED)
-- ═══════════════════════════════════════════════════════════════
-- 1. Go to Authentication > Users in your Supabase Dashboard
-- 2. Click "Add user" > "Create new user"
-- 3. Enter email and password
-- 4. The profile will be auto-created by the trigger

-- ═══════════════════════════════════════════════════════════════
-- OPTION 2: Use Supabase Admin API (via SQL)
-- ═══════════════════════════════════════════════════════════════
-- This creates users programmatically with hashed passwords

-- Create test users using Supabase's auth.users table
-- Note: This requires the pgcrypto extension and service_role access

-- First, ensure the extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to create a user with email/password
CREATE OR REPLACE FUNCTION create_user_with_password(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'consultant'
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', COALESCE(user_full_name, user_email)),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

  -- The profile will be auto-created by the trigger
  -- But we can update the role if needed
  UPDATE profiles 
  SET role = user_role, full_name = COALESCE(user_full_name, user_email)
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- CREATE YOUR USERS HERE
-- ═══════════════════════════════════════════════════════════════
-- Uncomment and modify the lines below to create users

-- Example: Create an admin user
-- SELECT create_user_with_password(
--   'admin@adesso.de',
--   'Admin123!',
--   'Admin User',
--   'admin'
-- );

-- Example: Create consultant users
-- SELECT create_user_with_password(
--   'berater1@adesso.de',
--   'Berater123!',
--   'Max Mustermann',
--   'consultant'
-- );

-- SELECT create_user_with_password(
--   'berater2@adesso.de',
--   'Berater123!',
--   'Erika Musterfrau',
--   'consultant'
-- );

-- ═══════════════════════════════════════════════════════════════
-- ALTERNATIVE: Direct INSERT (if function doesn't work)
-- ═══════════════════════════════════════════════════════════════
-- If the function above doesn't work due to permissions, 
-- use the Supabase Dashboard or this direct approach:

-- INSERT INTO auth.users (
--   id,
--   instance_id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   raw_user_meta_data,
--   created_at,
--   updated_at,
--   role,
--   aud
-- ) VALUES (
--   gen_random_uuid(),
--   '00000000-0000-0000-0000-000000000000',
--   'your.email@adesso.de',
--   crypt('YourPassword123!', gen_salt('bf')),
--   NOW(),
--   '{"full_name": "Your Name"}'::jsonb,
--   NOW(),
--   NOW(),
--   'authenticated',
--   'authenticated'
-- );

-- ═══════════════════════════════════════════════════════════════
-- VIEW EXISTING USERS
-- ═══════════════════════════════════════════════════════════════
-- SELECT id, email, created_at FROM auth.users;
-- SELECT * FROM profiles;
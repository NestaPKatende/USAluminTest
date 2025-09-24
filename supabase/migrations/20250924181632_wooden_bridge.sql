/*
  # Alumni Profiling System Database Schema

  1. New Tables
    - `alumni_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `cohort_year` (integer)
      - `program` (text)
      - `current_profession` (text)
      - `current_organization` (text)
      - `bio` (text)
      - `skills` (text array)
      - `interests` (text array)
      - `location` (text)
      - `profile_photo_url` (text)
      - `cv_url` (text)
      - `social_links` (jsonb)
      - `is_approved` (boolean, default false)
      - `is_public` (boolean, default true)
      - `profile_views` (integer, default 0)
      - `profile_shares` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `work_experiences`
      - `id` (uuid, primary key)
      - `alumni_id` (uuid, references alumni_profiles)
      - `organization_name` (text)
      - `position_title` (text)
      - `location` (text)
      - `start_date` (date)
      - `end_date` (date, nullable)
      - `is_current` (boolean, default false)
      - `description` (text)
      - `created_at` (timestamp)

    - `profile_views`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references alumni_profiles)
      - `viewer_ip` (text)
      - `viewer_id` (uuid, nullable, references auth.users)
      - `viewed_at` (timestamp)

    - `admin_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, default 'admin')
      - `permissions` (text array)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add admin policies for managing all data
    - Add public policies for viewing approved profiles
*/

-- Create alumni_profiles table
CREATE TABLE IF NOT EXISTS alumni_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  cohort_year integer NOT NULL,
  program text NOT NULL,
  current_profession text,
  current_organization text,
  bio text,
  skills text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  location text,
  profile_photo_url text,
  cv_url text,
  social_links jsonb DEFAULT '{}',
  is_approved boolean DEFAULT false,
  is_public boolean DEFAULT true,
  profile_views integer DEFAULT 0,
  profile_shares integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create work_experiences table
CREATE TABLE IF NOT EXISTS work_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id uuid REFERENCES alumni_profiles(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  position_title text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES alumni_profiles(id) ON DELETE CASCADE,
  viewer_ip text,
  viewer_id uuid REFERENCES auth.users(id),
  viewed_at timestamptz DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'admin',
  permissions text[] DEFAULT '{"approve_profiles", "manage_users", "view_analytics"}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Alumni profiles policies
CREATE POLICY "Users can view approved public profiles"
  ON alumni_profiles
  FOR SELECT
  TO authenticated
  USING (is_approved = true AND is_public = true);

CREATE POLICY "Users can view their own profile"
  ON alumni_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON alumni_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON alumni_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Work experiences policies
CREATE POLICY "Users can view work experience of approved profiles"
  ON work_experiences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_profiles 
      WHERE id = alumni_id 
      AND (is_approved = true AND is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage their own work experience"
  ON work_experiences
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_profiles 
      WHERE id = alumni_id AND user_id = auth.uid()
    )
  );

-- Profile views policies
CREATE POLICY "Anyone can insert profile views"
  ON profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view profile analytics for their own profile"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alumni_profiles 
      WHERE id = profile_id AND user_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Only admins can access admin table"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Admin policies for managing all data
CREATE POLICY "Admins can manage all profiles"
  ON alumni_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for alumni_profiles
CREATE TRIGGER update_alumni_profiles_updated_at
  BEFORE UPDATE ON alumni_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_user_id ON alumni_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_approved ON alumni_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_cohort ON alumni_profiles(cohort_year);
CREATE INDEX IF NOT EXISTS idx_work_experiences_alumni_id ON work_experiences(alumni_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);

-- Insert sample admin user (replace with actual admin user ID)
-- Note: This would typically be done after user registration
-- INSERT INTO admin_users (user_id) VALUES ('admin-user-id-here');
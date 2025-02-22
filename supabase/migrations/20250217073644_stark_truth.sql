/*
  # Initial Schema Setup

  1. New Tables
    - `schools`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (text)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `city` (text)
      - `postal_code` (text)
      - `director_name` (text)
      - `created_at` (timestamptz)
      - `ai_preferences` (jsonb)

    - `classes`
      - `id` (uuid, primary key)
      - `school_id` (uuid, foreign key)
      - `name` (text)
      - `student_count` (integer)
      - `created_at` (timestamptz)

    - `students`
      - `id` (uuid, primary key)
      - `class_id` (uuid, foreign key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their school's data
*/

-- Schools table
CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  director_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  ai_preferences jsonb DEFAULT '{
    "adaptiveLearning": true,
    "visualLearning": true,
    "textualLearning": true,
    "interactiveLearning": true
  }'::jsonb,
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own school"
  ON schools
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Classes table
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  student_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage classes of their school"
  ON classes
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = classes.school_id
    AND schools.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = classes.school_id
    AND schools.user_id = auth.uid()
  ));

-- Students table
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage students in their school's classes"
  ON students
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM classes
    JOIN schools ON schools.id = classes.school_id
    WHERE classes.id = students.class_id
    AND schools.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM classes
    JOIN schools ON schools.id = classes.school_id
    WHERE classes.id = students.class_id
    AND schools.user_id = auth.uid()
  ));
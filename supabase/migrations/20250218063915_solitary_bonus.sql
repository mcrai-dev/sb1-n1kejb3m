/*
  # Add teachers and courses management

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `bio` (text)
      - `created_at` (timestamp)
      - `school_id` (uuid, references schools)

    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `school_id` (uuid, references schools)
      - `created_at` (timestamp)

    - `courses`
      - `id` (uuid, primary key)
      - `subject_id` (uuid, references subjects)
      - `teacher_id` (uuid, references teachers)
      - `class_id` (uuid, references classes)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Teachers table
CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  bio text,
  created_at timestamptz DEFAULT now(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teachers from their school"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = teachers.school_id
    AND schools.user_id = auth.uid()
  ));

CREATE POLICY "School admin can manage teachers"
  ON teachers
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = teachers.school_id
    AND schools.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = teachers.school_id
    AND schools.user_id = auth.uid()
  ));

-- Subjects table
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subjects from their school"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = subjects.school_id
    AND schools.user_id = auth.uid()
  ));

CREATE POLICY "School admin can manage subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = subjects.school_id
    AND schools.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM schools
    WHERE schools.id = subjects.school_id
    AND schools.user_id = auth.uid()
  ));

-- Courses table
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view courses from their school"
  ON courses
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM teachers
    JOIN schools ON schools.id = teachers.school_id
    WHERE teachers.id = courses.teacher_id
    AND schools.user_id = auth.uid()
  ));

CREATE POLICY "School admin can manage courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM teachers
    JOIN schools ON schools.id = teachers.school_id
    WHERE teachers.id = courses.teacher_id
    AND schools.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM teachers
    JOIN schools ON schools.id = teachers.school_id
    WHERE teachers.id = courses.teacher_id
    AND schools.user_id = auth.uid()
  ));
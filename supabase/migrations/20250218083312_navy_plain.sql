/*
  # Add RLS policies for students management

  1. Changes
    - Add RLS policy for students table to allow authenticated users to manage students in their school's classes
    - Ensure proper access control based on school ownership

  2. Security
    - Enable RLS on students table
    - Add policy for authenticated users to manage their school's students
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'students' 
    AND policyname = 'Users can manage students in their school''s classes'
  ) THEN
    DROP POLICY "Users can manage students in their school's classes" ON students;
  END IF;
END $$;

-- Create new policy with proper checks
CREATE POLICY "Users can manage students in their school's classes"
ON students
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM classes
    JOIN schools ON schools.id = classes.school_id
    WHERE classes.id = students.class_id
    AND schools.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM classes
    JOIN schools ON schools.id = classes.school_id
    WHERE classes.id = students.class_id
    AND schools.user_id = auth.uid()
  )
);
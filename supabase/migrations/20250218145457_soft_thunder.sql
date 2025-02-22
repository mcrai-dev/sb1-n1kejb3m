/*
  # Add teacher subjects management

  1. New Tables
    - `teacher_subjects`: Liaison entre enseignants et matières
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, foreign key)
      - `subject_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `teacher_subjects` table
    - Add policies for school administrators
*/

CREATE TABLE IF NOT EXISTS teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teacher subjects from their school"
  ON teacher_subjects
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM teachers
    JOIN schools ON schools.id = teachers.school_id
    WHERE teachers.id = teacher_subjects.teacher_id
    AND schools.user_id = auth.uid()
  ));

CREATE POLICY "School admin can manage teacher subjects"
  ON teacher_subjects
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM teachers
    JOIN schools ON schools.id = teachers.school_id
    WHERE teachers.id = teacher_subjects.teacher_id
    AND schools.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM teachers
    JOIN schools ON schools.id = teachers.school_id
    WHERE teachers.id = teacher_subjects.teacher_id
    AND schools.user_id = auth.uid()
  ));
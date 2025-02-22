/*
  # Fix student registration

  1. Changes
    - Drop automatic account creation triggers
    - Add school_id column to students if not exists
    - Update RLS policies for better security

  2. Security
    - Ensure proper RLS policies for student management
    - Prevent automatic account creation
*/

-- Supprimer les triggers d'enregistrement automatique
DROP TRIGGER IF EXISTS create_student_account ON students;
DROP TRIGGER IF EXISTS create_teacher_account ON teachers;
DROP TRIGGER IF EXISTS create_school_account ON schools;

-- Ajouter la colonne school_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE students ADD COLUMN school_id uuid REFERENCES schools(id);
  END IF;
END $$;

-- Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Users can view students from their school" ON students;
DROP POLICY IF EXISTS "School admin can add students" ON students;
DROP POLICY IF EXISTS "School admin can update students" ON students;
DROP POLICY IF EXISTS "School admin can delete students" ON students;

-- Politique pour la lecture
CREATE POLICY "Users can view students from their school"
ON students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM schools
    WHERE schools.id = students.school_id
    AND schools.user_id = auth.uid()
  )
  OR
  students.user_id = auth.uid()
);

-- Politique pour l'insertion
CREATE POLICY "School admin can add students"
ON students
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM schools
    WHERE schools.id = students.school_id
    AND schools.user_id = auth.uid()
  )
);

-- Politique pour la mise à jour
CREATE POLICY "School admin can update students"
ON students
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM schools
    WHERE schools.id = students.school_id
    AND schools.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM schools
    WHERE schools.id = students.school_id
    AND schools.user_id = auth.uid()
  )
);

-- Politique pour la suppression
CREATE POLICY "School admin can delete students"
ON students
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM schools
    WHERE schools.id = students.school_id
    AND schools.user_id = auth.uid()
  )
);
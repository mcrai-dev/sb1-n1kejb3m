/*
  # Fix RLS policies and add school_id to students

  1. Changes
    - Add school_id column to students table
    - Update RLS policies for better security
    - Fix unique constraint on email per school

  2. Security
    - Students can only be managed by their school admin
    - Students can view their own data
    - Email uniqueness is now per school
*/

-- Ajouter la colonne school_id à la table students
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id);

-- Mettre à jour les contraintes uniques
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;
ALTER TABLE students ADD CONSTRAINT students_email_school_unique UNIQUE (email, school_id);

-- Mettre à jour les politiques RLS pour students
DROP POLICY IF EXISTS "Users can manage students in their school's classes" ON students;

-- Politique pour la lecture
CREATE POLICY "Users can view students from their school"
ON students
FOR SELECT
TO authenticated
USING (
  -- L'administrateur de l'école peut voir tous les étudiants
  EXISTS (
    SELECT 1 
    FROM schools
    WHERE schools.id = students.school_id
    AND schools.user_id = auth.uid()
  )
  OR
  -- Les étudiants peuvent voir leurs propres données
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
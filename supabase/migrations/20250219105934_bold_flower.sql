-- Ajouter la colonne user_id à la table students
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE students ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Mettre à jour les politiques RLS pour students
DROP POLICY IF EXISTS "Users can manage students in their school's classes" ON students;

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
  OR
  auth.uid() = user_id
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
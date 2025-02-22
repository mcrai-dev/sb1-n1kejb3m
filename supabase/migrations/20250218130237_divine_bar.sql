/*
  # Add registration number to students table

  1. Changes
    - Add `registration_number` column to `students` table
    - Make it optional to support existing records
    - Add index for faster lookups

  2. Notes
    - No data loss as new column is nullable
    - Existing records will have NULL registration_number
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'registration_number'
  ) THEN
    ALTER TABLE students ADD COLUMN registration_number text;
    CREATE INDEX idx_students_registration_number ON students(registration_number);
  END IF;
END $$;
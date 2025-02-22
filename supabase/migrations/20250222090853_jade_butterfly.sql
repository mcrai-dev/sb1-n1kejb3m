/*
  # Add default password to teachers table

  1. Changes
    - Add default_password column to teachers table
    - Add index for faster password lookups
*/

-- Add default_password column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teachers' AND column_name = 'default_password'
  ) THEN
    ALTER TABLE teachers ADD COLUMN default_password text;
  END IF;
END $$;

-- Create index for password lookups
CREATE INDEX IF NOT EXISTS idx_teachers_default_password 
  ON teachers(default_password);
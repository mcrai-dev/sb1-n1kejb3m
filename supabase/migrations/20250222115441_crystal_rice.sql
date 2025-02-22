/*
  # Add default password functionality
  
  1. New Functions
    - `generate_default_password`: Generates a secure default password based on user info
  
  2. Schema Changes
    - Add `default_password` column to students table
    - Create index for password lookups
*/

-- Create function to generate default passwords
CREATE OR REPLACE FUNCTION generate_default_password(
  first_name text,
  last_name text,
  birth_date date DEFAULT NULL,
  registration_number text DEFAULT NULL
) RETURNS text AS $$
DECLARE
  base_password text;
  special_chars text := '!@#$%^&*-_+=';
  upper_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  lower_chars text := 'abcdefghijklmnopqrstuvwxyz';
  numbers text := '0123456789';
  random_special char;
  random_upper char;
  random_lower char;
  random_number char;
BEGIN
  -- Clean and format name
  first_name := regexp_replace(lower(unaccent(first_name)), '[^a-z]', '', 'g');
  last_name := regexp_replace(lower(unaccent(last_name)), '[^a-z]', '', 'g');
  
  -- Take first 3 letters of first and last name
  first_name := substring(first_name, 1, 3);
  last_name := substring(last_name, 1, 3);
  
  -- Get random characters
  random_special := substring(special_chars from (random() * length(special_chars))::integer + 1 for 1);
  random_upper := substring(upper_chars from (random() * length(upper_chars))::integer + 1 for 1);
  random_lower := substring(lower_chars from (random() * length(lower_chars))::integer + 1 for 1);
  random_number := substring(numbers from (random() * length(numbers))::integer + 1 for 1);
  
  -- Build base password
  IF registration_number IS NOT NULL THEN
    -- For students: first3+last3+reg_number
    base_password := first_name || last_name || registration_number;
  ELSIF birth_date IS NOT NULL THEN
    -- For teachers: first3+last3+birth_date(DDMM)
    base_password := first_name || last_name || to_char(birth_date, 'DDMM');
  ELSE
    -- For schools: first3+last3+year
    base_password := first_name || last_name || to_char(current_date, 'YYYY');
  END IF;
  
  -- Add random characters to ensure complexity
  RETURN base_password || random_upper || random_lower || random_special || random_number;
END;
$$ LANGUAGE plpgsql;

-- Add default_password column to students table
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS default_password text;

-- Create index for password lookups
CREATE INDEX IF NOT EXISTS idx_students_default_password 
  ON students(default_password);

-- Update existing students to have a default password
UPDATE students
SET default_password = generate_default_password(
  first_name,
  last_name,
  NULL,
  registration_number
)
WHERE default_password IS NULL;
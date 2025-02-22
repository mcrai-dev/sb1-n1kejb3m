/*
  # Ajout des champs téléphone et avatar pour les étudiants

  1. Modifications
    - Ajout de la colonne `phone` (texte, optionnel) pour stocker le numéro de téléphone
    - Ajout de la colonne `avatar` (texte, optionnel) pour stocker l'URL de l'avatar
    - Ajout d'un index sur la colonne `phone` pour optimiser les recherches

  2. Notes
    - Les deux champs sont optionnels
    - L'avatar sera stocké sous forme d'URL (pas de stockage direct de fichiers)
*/

-- Ajouter les nouvelles colonnes
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar text;

-- Créer un index sur le numéro de téléphone
CREATE INDEX IF NOT EXISTS idx_students_phone 
  ON students(phone);

-- Mettre à jour les politiques RLS existantes
DROP POLICY IF EXISTS "School admin can manage students" ON students;

CREATE POLICY "School admin can manage students"
ON students
FOR ALL
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM schools
    WHERE schools.id = students.school_id
    AND schools.user_id = auth.uid()
  )
);
/*
  # Correction des politiques RLS pour la table students

  1. Changements
    - Correction des politiques RLS pour permettre l'insertion et la mise à jour des étudiants
    - Ajout de vérifications plus précises pour la sécurité
    - Simplification des conditions pour éviter les erreurs

  2. Sécurité
    - Les administrateurs d'école peuvent gérer leurs étudiants
    - Les étudiants peuvent voir leurs propres données
    - Protection contre les accès non autorisés
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view students from their school" ON students;
DROP POLICY IF EXISTS "School admin can add students" ON students;
DROP POLICY IF EXISTS "School admin can update students" ON students;
DROP POLICY IF EXISTS "School admin can delete students" ON students;

-- Politique unique pour toutes les opérations
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

-- S'assurer que la colonne school_id est NOT NULL
ALTER TABLE students 
  ALTER COLUMN school_id SET NOT NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_students_school_id 
  ON students(school_id);
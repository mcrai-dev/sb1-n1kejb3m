/*
  # Correction des politiques RLS pour la gestion des étudiants

  1. Modifications
    - Mise à jour des politiques RLS pour la table students
    - Correction de la syntaxe pour les politiques d'insertion et de mise à jour
    - Simplification des conditions des politiques

  2. Sécurité
    - Maintien de la sécurité par école
    - Vérification de l'appartenance à l'école pour toutes les opérations
*/

-- Supprimer les anciennes politiques
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
    WHERE schools.id = school_id
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
    WHERE schools.id = school_id
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
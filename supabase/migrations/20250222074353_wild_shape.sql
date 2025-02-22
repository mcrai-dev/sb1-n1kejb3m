/*
  # Mise à jour de la contrainte d'unicité des emails des enseignants

  1. Changements
    - Suppression de la contrainte d'unicité simple sur l'email
    - Ajout d'une contrainte d'unicité composite sur (email, school_id)
    - Ajout d'un index pour améliorer les performances des recherches

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Supprimer l'ancienne contrainte d'unicité
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_email_key;

-- Ajouter la nouvelle contrainte d'unicité composite
ALTER TABLE teachers 
  ADD CONSTRAINT teachers_email_school_unique 
  UNIQUE (email, school_id);

-- Créer un index pour optimiser les recherches par email
CREATE INDEX IF NOT EXISTS idx_teachers_email 
  ON teachers(email);
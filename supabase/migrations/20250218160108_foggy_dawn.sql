/*
  # Suppression des triggers d'authentification

  1. Modifications
    - Suppression des triggers de création de compte
    - Suppression des fonctions associées
    - Conservation des colonnes user_id pour la liaison

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Supprimer les triggers
DROP TRIGGER IF EXISTS create_student_account ON students;
DROP TRIGGER IF EXISTS create_teacher_account ON teachers;
DROP TRIGGER IF EXISTS create_school_account ON schools;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS create_student_auth_account();
DROP FUNCTION IF EXISTS create_teacher_auth_account();
DROP FUNCTION IF EXISTS create_school_auth_account();
DROP FUNCTION IF EXISTS generate_default_password(text, text, date, text);
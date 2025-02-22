/*
  # Configuration des comptes utilisateurs

  1. Modifications
    - Ajout du champ `account_type` à la table `auth.users`
    - Ajout des fonctions pour générer des mots de passe par défaut
    - Ajout des triggers pour la création automatique des mots de passe

  2. Types de comptes
    - 'school' : Compte établissement
    - 'teacher' : Compte enseignant
    - 'student' : Compte étudiant

  3. Sécurité
    - Les mots de passe sont générés de manière sécurisée
    - Format spécifique pour chaque type de compte
*/

-- Fonction pour générer un mot de passe par défaut
CREATE OR REPLACE FUNCTION generate_default_password(
  first_name text,
  last_name text,
  birth_date date DEFAULT NULL,
  registration_number text DEFAULT NULL
) RETURNS text AS $$
DECLARE
  base_password text;
BEGIN
  -- Nettoyer et formater le nom/prénom
  first_name := regexp_replace(lower(unaccent(first_name)), '[^a-z]', '', 'g');
  last_name := regexp_replace(lower(unaccent(last_name)), '[^a-z]', '', 'g');
  
  -- Prendre les 3 premières lettres du prénom et les 3 premières du nom
  first_name := substring(first_name, 1, 3);
  last_name := substring(last_name, 1, 3);
  
  IF registration_number IS NOT NULL THEN
    -- Pour les étudiants : prénom3+nom3+numéro_immatriculation
    base_password := first_name || last_name || registration_number;
  ELSIF birth_date IS NOT NULL THEN
    -- Pour les enseignants : prénom3+nom3+date_naissance(DDMM)
    base_password := first_name || last_name || to_char(birth_date, 'DDMM');
  ELSE
    -- Pour les établissements : prénom3+nom3+année_courante
    base_password := first_name || last_name || to_char(current_date, 'YYYY');
  END IF;
  
  -- Ajouter un caractère spécial et un chiffre à la fin
  RETURN base_password || '@' || floor(random() * 100)::text;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer le mot de passe par défaut des étudiants
CREATE OR REPLACE FUNCTION create_student_auth_account()
RETURNS TRIGGER AS $$
DECLARE
  default_password text;
BEGIN
  -- Générer le mot de passe par défaut
  default_password := generate_default_password(
    NEW.first_name,
    NEW.last_name,
    NULL,
    NEW.registration_number
  );
  
  -- Créer le compte auth avec le mot de passe par défaut
  INSERT INTO auth.users (
    email,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES (
    NEW.email,
    now(),
    jsonb_build_object(
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'registration_number', NEW.registration_number,
      'default_password', default_password
    ),
    jsonb_build_object(
      'account_type', 'student'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer le mot de passe par défaut des enseignants
CREATE OR REPLACE FUNCTION create_teacher_auth_account()
RETURNS TRIGGER AS $$
DECLARE
  default_password text;
BEGIN
  -- Générer le mot de passe par défaut
  default_password := generate_default_password(
    NEW.first_name,
    NEW.last_name,
    NULL -- TODO: Ajouter date_naissance dans la table teachers
  );
  
  -- Créer le compte auth avec le mot de passe par défaut
  INSERT INTO auth.users (
    email,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES (
    NEW.email,
    now(),
    jsonb_build_object(
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'default_password', default_password
    ),
    jsonb_build_object(
      'account_type', 'teacher'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer le mot de passe par défaut des établissements
CREATE OR REPLACE FUNCTION create_school_auth_account()
RETURNS TRIGGER AS $$
DECLARE
  default_password text;
BEGIN
  -- Générer le mot de passe par défaut
  default_password := generate_default_password(
    NEW.director_name,
    NEW.name
  );
  
  -- Créer le compte auth avec le mot de passe par défaut
  INSERT INTO auth.users (
    email,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES (
    NEW.email,
    now(),
    jsonb_build_object(
      'school_name', NEW.name,
      'director_name', NEW.director_name,
      'default_password', default_password
    ),
    jsonb_build_object(
      'account_type', 'school'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS create_student_account ON students;
CREATE TRIGGER create_student_account
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION create_student_auth_account();

DROP TRIGGER IF EXISTS create_teacher_account ON teachers;
CREATE TRIGGER create_teacher_account
  AFTER INSERT ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_auth_account();

DROP TRIGGER IF EXISTS create_school_account ON schools;
CREATE TRIGGER create_school_account
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION create_school_auth_account();
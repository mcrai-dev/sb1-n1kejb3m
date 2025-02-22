/*
  # Correction de la création des comptes utilisateurs

  1. Modifications
    - Utilisation de auth.users pour la création des comptes
    - Mise à jour des triggers pour utiliser la méthode correcte
    - Ajout des permissions nécessaires

  2. Sécurité
    - Utilisation de SECURITY DEFINER pour les fonctions
    - Gestion sécurisée des mots de passe
*/

-- Mettre à jour la fonction de création de compte étudiant
CREATE OR REPLACE FUNCTION create_student_auth_account()
RETURNS TRIGGER AS $$
DECLARE
  default_password text;
  user_id uuid;
BEGIN
  -- Générer le mot de passe par défaut
  default_password := generate_default_password(
    NEW.first_name,
    NEW.last_name,
    NULL,
    NEW.registration_number
  );
  
  -- Créer le compte auth
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES (
    NEW.email,
    crypt(default_password, gen_salt('bf')),
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
  ) RETURNING id INTO user_id;
  
  -- Mettre à jour l'ID utilisateur
  UPDATE students 
  SET user_id = user_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction de création de compte enseignant
CREATE OR REPLACE FUNCTION create_teacher_auth_account()
RETURNS TRIGGER AS $$
DECLARE
  default_password text;
  user_id uuid;
BEGIN
  -- Générer le mot de passe par défaut
  default_password := generate_default_password(
    NEW.first_name,
    NEW.last_name,
    NULL
  );
  
  -- Créer le compte auth
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES (
    NEW.email,
    crypt(default_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'first_name', NEW.first_name,
      'last_name', NEW.last_name,
      'default_password', default_password
    ),
    jsonb_build_object(
      'account_type', 'teacher'
    )
  ) RETURNING id INTO user_id;
  
  -- Mettre à jour l'ID utilisateur
  UPDATE teachers 
  SET user_id = user_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour la fonction de création de compte établissement
CREATE OR REPLACE FUNCTION create_school_auth_account()
RETURNS TRIGGER AS $$
DECLARE
  default_password text;
  user_id uuid;
BEGIN
  -- Générer le mot de passe par défaut
  default_password := generate_default_password(
    NEW.director_name,
    NEW.name
  );
  
  -- Créer le compte auth
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES (
    NEW.email,
    crypt(default_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'school_name', NEW.name,
      'director_name', NEW.director_name,
      'default_password', default_password
    ),
    jsonb_build_object(
      'account_type', 'school'
    )
  ) RETURNING id INTO user_id;
  
  -- Mettre à jour l'ID utilisateur
  UPDATE schools 
  SET user_id = user_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT ALL ON auth.users TO authenticated;
GRANT EXECUTE ON FUNCTION create_student_auth_account() TO authenticated;
GRANT EXECUTE ON FUNCTION create_teacher_auth_account() TO authenticated;
GRANT EXECUTE ON FUNCTION create_school_auth_account() TO authenticated;
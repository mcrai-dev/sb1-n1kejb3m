/*
  # Correction des permissions d'authentification

  1. Modifications
    - Ajout d'une fonction sécurisée pour créer les comptes utilisateurs
    - Mise à jour des triggers pour utiliser la nouvelle fonction
    - Correction des permissions pour la création des comptes

  2. Sécurité
    - Utilisation de auth.create_user() au lieu d'INSERT direct
    - Gestion sécurisée des mots de passe par défaut
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
  
  -- Créer le compte auth de manière sécurisée
  user_id := auth.create_user(
    jsonb_build_object(
      'email', NEW.email,
      'password', default_password,
      'email_confirm', true,
      'user_metadata', jsonb_build_object(
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'registration_number', NEW.registration_number,
        'default_password', default_password
      ),
      'app_metadata', jsonb_build_object(
        'account_type', 'student'
      )
    )
  );
  
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
  
  -- Créer le compte auth de manière sécurisée
  user_id := auth.create_user(
    jsonb_build_object(
      'email', NEW.email,
      'password', default_password,
      'email_confirm', true,
      'user_metadata', jsonb_build_object(
        'first_name', NEW.first_name,
        'last_name', NEW.last_name,
        'default_password', default_password
      ),
      'app_metadata', jsonb_build_object(
        'account_type', 'teacher'
      )
    )
  );
  
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
  
  -- Créer le compte auth de manière sécurisée
  user_id := auth.create_user(
    jsonb_build_object(
      'email', NEW.email,
      'password', default_password,
      'email_confirm', true,
      'user_metadata', jsonb_build_object(
        'school_name', NEW.name,
        'director_name', NEW.director_name,
        'default_password', default_password
      ),
      'app_metadata', jsonb_build_object(
        'account_type', 'school'
      )
    )
  );
  
  -- Mettre à jour l'ID utilisateur
  UPDATE schools 
  SET user_id = user_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_student_auth_account() TO authenticated;
GRANT EXECUTE ON FUNCTION create_teacher_auth_account() TO authenticated;
GRANT EXECUTE ON FUNCTION create_school_auth_account() TO authenticated;
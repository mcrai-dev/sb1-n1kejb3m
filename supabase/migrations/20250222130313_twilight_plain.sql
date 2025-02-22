/*
  # Mise à jour du système d'authentification

  1. Modifications
    - Ajout de la table auth_settings pour la configuration
    - Ajout de triggers pour la gestion des mots de passe par défaut
    - Mise à jour des politiques de sécurité

  2. Sécurité
    - Validation stricte des types de compte
    - Gestion sécurisée des mots de passe par défaut
    - Politiques RLS mises à jour
*/

-- Configuration de l'authentification
CREATE TABLE IF NOT EXISTS auth_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  allow_student_registration boolean DEFAULT false,
  allow_teacher_registration boolean DEFAULT false,
  password_expiry_days integer DEFAULT 90,
  min_password_length integer DEFAULT 8,
  require_password_change boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(school_id)
);

-- Activer RLS
ALTER TABLE auth_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour auth_settings
CREATE POLICY "School admin can manage auth settings"
  ON auth_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = auth_settings.school_id
      AND schools.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schools
      WHERE schools.id = auth_settings.school_id
      AND schools.user_id = auth.uid()
    )
  );

-- Fonction pour valider le type de compte
CREATE OR REPLACE FUNCTION validate_account_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que le type est valide
  IF NEW.type NOT IN ('student', 'teacher', 'school') THEN
    RAISE EXCEPTION 'Type de compte invalide: %', NEW.type;
  END IF;

  -- Vérifier qu'un utilisateur n'a qu'un seul type
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = NEW.user_id
    AND id != COALESCE(NEW.id, uuid_nil())
  ) THEN
    RAISE EXCEPTION 'Un utilisateur ne peut avoir qu''un seul type de compte';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la validation du type de compte
DROP TRIGGER IF EXISTS validate_account_type_trigger ON user_profiles;
CREATE TRIGGER validate_account_type_trigger
  BEFORE INSERT OR UPDATE OF type
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_account_type();

-- Fonction pour gérer les mots de passe par défaut
CREATE OR REPLACE FUNCTION handle_default_password()
RETURNS TRIGGER AS $$
DECLARE
  default_pwd text;
BEGIN
  -- Générer le mot de passe par défaut selon le type
  CASE NEW.type
    WHEN 'student' THEN
      default_pwd := generate_default_password(
        NEW.first_name,
        NEW.last_name,
        NULL,
        NEW.registration_number
      );
      UPDATE students
      SET default_password = default_pwd
      WHERE user_id = NEW.user_id;
    
    WHEN 'teacher' THEN
      default_pwd := generate_default_password(
        NEW.first_name,
        NEW.last_name
      );
      UPDATE teachers
      SET default_password = default_pwd
      WHERE user_id = NEW.user_id;
    
    WHEN 'school' THEN
      -- Les écoles gèrent leur mot de passe lors de l'inscription
      RETURN NEW;
  END CASE;

  -- Mettre à jour le mot de passe dans auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(default_pwd, gen_salt('bf'))
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour la gestion des mots de passe par défaut
DROP TRIGGER IF EXISTS handle_default_password_trigger ON user_profiles;
CREATE TRIGGER handle_default_password_trigger
  AFTER INSERT
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_default_password();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_auth_settings_school_id ON auth_settings(school_id);

-- Commentaires
COMMENT ON TABLE auth_settings IS 'Configuration de l''authentification par établissement';
COMMENT ON COLUMN auth_settings.allow_student_registration IS 'Autoriser l''inscription des étudiants';
COMMENT ON COLUMN auth_settings.allow_teacher_registration IS 'Autoriser l''inscription des enseignants';
COMMENT ON COLUMN auth_settings.password_expiry_days IS 'Nombre de jours avant expiration du mot de passe';
COMMENT ON COLUMN auth_settings.min_password_length IS 'Longueur minimale du mot de passe';
COMMENT ON COLUMN auth_settings.require_password_change IS 'Forcer le changement du mot de passe à la première connexion';
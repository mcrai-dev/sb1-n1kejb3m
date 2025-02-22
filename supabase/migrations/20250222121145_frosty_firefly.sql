/*
  # Séparation des utilisateurs et migration des données

  1. Nouvelles Tables
    - `user_profiles` : Table centrale pour les profils utilisateurs
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence auth.users)
      - `type` (text, type de compte)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications
    - Ajout de contraintes pour assurer l'intégrité des données
    - Migration des données existantes
    - Mise à jour des politiques RLS

  3. Sécurité
    - Activation de RLS sur la nouvelle table
    - Ajout de politiques d'accès
*/

-- Créer la table des profils utilisateurs
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('student', 'teacher', 'school')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Activer RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migrer les données existantes
INSERT INTO user_profiles (user_id, type)
SELECT user_id, 'student'
FROM students
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, type)
SELECT user_id, 'teacher'
FROM teachers
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, type)
SELECT user_id, 'school'
FROM schools
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Fonction pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la mise à jour automatique
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour assurer la cohérence des types de compte
CREATE OR REPLACE FUNCTION ensure_account_type_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les métadonnées de l'utilisateur
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{account_type}',
    to_jsonb(NEW.type)
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour la cohérence des types de compte
CREATE TRIGGER ensure_account_type_consistency_trigger
  AFTER INSERT OR UPDATE OF type
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_account_type_consistency();

-- Index pour améliorer les performances
CREATE INDEX idx_user_profiles_type ON user_profiles(type);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Commentaires pour la documentation
COMMENT ON TABLE user_profiles IS 'Profils utilisateurs centralisés';
COMMENT ON COLUMN user_profiles.type IS 'Type de compte : student, teacher, ou school';
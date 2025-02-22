-- Mettre à jour les métadonnées des utilisateurs d'école existants
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{account_type}',
  '"school"'
)
WHERE id IN (
  SELECT user_id 
  FROM schools 
  WHERE user_id IS NOT NULL
);

-- Créer une fonction pour s'assurer que les nouveaux utilisateurs d'école ont les bonnes métadonnées
CREATE OR REPLACE FUNCTION public.ensure_school_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les métadonnées de l'utilisateur
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{account_type}',
    '"school"'
  )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un trigger pour appliquer automatiquement les métadonnées
DROP TRIGGER IF EXISTS ensure_school_metadata_trigger ON schools;
CREATE TRIGGER ensure_school_metadata_trigger
  AFTER INSERT OR UPDATE OF user_id
  ON schools
  FOR EACH ROW
  EXECUTE FUNCTION ensure_school_metadata();
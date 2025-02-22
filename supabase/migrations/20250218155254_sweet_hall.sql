/*
  # Ajout de l'extension unaccent

  1. Modifications
    - Installation de l'extension unaccent pour le traitement des accents

  2. Sécurité
    - L'extension est installée au niveau de la base de données
    - Seuls les super-utilisateurs peuvent installer des extensions
*/

-- Créer l'extension unaccent si elle n'existe pas
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.unaccent(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unaccent(text) TO anon;
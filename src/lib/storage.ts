import { supabase } from './supabase';

export async function uploadAvatar(file: File, userId: string) {
  try {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('L\'image ne doit pas dépasser 5MB');
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Uploader le fichier
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (error) throw error;

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

export async function deleteAvatar(url: string) {
  try {
    // Extraire le nom du fichier de l'URL
    const fileName = url.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
}
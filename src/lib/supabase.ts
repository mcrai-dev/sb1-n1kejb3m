import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Valider et nettoyer l'URL Supabase
function validateSupabaseUrl(url: string): string {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('https://')) {
      throw new Error('Supabase URL must start with https://');
    }
    return cleanUrl.replace(/\/$/, '');
  } catch (error) {
    console.error('Error validating Supabase URL:', error);
    throw new Error('Invalid Supabase URL configuration');
  }
}

// Valider et obtenir l'URL Supabase
const validatedUrl = validateSupabaseUrl(supabaseUrl);

// Créer le client Supabase avec la configuration optimisée
export const supabase = createClient<Database>(validatedUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'edubot.auth.token'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-application-name': 'edubot' }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});
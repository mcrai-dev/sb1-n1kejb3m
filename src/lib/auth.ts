import { supabase } from './supabase';
import { generateDefaultPassword } from './utils';
import { sendPasswordEmail } from './emailService';

// Types d'authentification
export type AuthType = 'student' | 'teacher' | 'school';

// Interface pour le profil utilisateur
interface UserProfile {
  type: AuthType;
  firstName: string;
  lastName: string;
  requirePasswordChange: boolean;
}

// Fonction de connexion
export async function signIn(email: string, password: string, type: AuthType) {
  try {
    // Connexion avec Supabase
    const { data: { session, user }, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!user) throw new Error('Utilisateur non trouvé');

    // Vérifier le type de compte
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('type')
      .eq('user_id', user.id)
      .single();

    if (!profile) throw new Error('Profil non trouvé');
    if (profile.type !== type) throw new Error('Type de compte incorrect');

    // Vérifier si le changement de mot de passe est requis
    const requirePasswordChange = user.user_metadata?.default_password === password;

    return {
      user,
      profile: {
        type: profile.type,
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
        requirePasswordChange
      } as UserProfile,
      session
    };
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
}

// Fonction de déconnexion
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
}

// Fonction pour créer un compte étudiant
export async function createStudentAccount(
  firstName: string,
  lastName: string,
  email: string,
  registrationNumber: string
) {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('Utilisateur non authentifié');

    // Récupérer l'ID de l'école
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (schoolError) throw schoolError;

    // Vérifier si l'étudiant existe déjà
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('id, email')
      .eq('email', email)
      .eq('school_id', school.id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingStudent) {
      return { 
        userId: existingStudent.id,
        defaultPassword: null,
        exists: true,
        message: 'Un compte existe déjà pour cet email'
      };
    }

    // Générer un mot de passe sécurisé
    const defaultPassword = generateDefaultPassword(firstName, lastName, registrationNumber);

    // Créer le compte auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: defaultPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          registration_number: registrationNumber,
          default_password: defaultPassword,
          account_type: 'student'
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Erreur lors de la création du compte');

    // Créer l'étudiant dans la base de données
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert([{
        first_name: firstName,
        last_name: lastName,
        email: email,
        registration_number: registrationNumber,
        user_id: authData.user.id,
        school_id: school.id,
        default_password: defaultPassword
      }])
      .select()
      .single();

    if (studentError) throw studentError;

    // Créer le profil utilisateur
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: authData.user.id,
        type: 'student'
      }]);

    if (profileError) throw profileError;

    // Envoyer un email avec les identifiants
    try {
      await sendPasswordEmail(
        email,
        firstName,
        lastName,
        defaultPassword,
        'student'
      );
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    return { 
      userId: student.id, 
      defaultPassword,
      exists: false,
      message: 'Compte créé avec succès. Un email a été envoyé avec les informations de connexion.'
    };
  } catch (error) {
    console.error('Error creating student account:', error);
    throw error;
  }
}

// Fonction pour créer un compte enseignant
export async function createTeacherAccount(
  firstName: string,
  lastName: string,
  email: string,
  phone?: string,
  bio?: string
) {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('Utilisateur non authentifié');

    // Récupérer l'ID de l'école
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (schoolError) throw schoolError;

    // Vérifier si l'enseignant existe déjà
    const { data: existingTeacher, error: checkError } = await supabase
      .from('teachers')
      .select('id, email')
      .eq('email', email)
      .eq('school_id', school.id)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingTeacher) {
      return { 
        userId: existingTeacher.id,
        defaultPassword: null,
        exists: true,
        message: 'Un compte existe déjà pour cet email'
      };
    }

    // Générer un mot de passe sécurisé
    const defaultPassword = generateDefaultPassword(firstName, lastName);

    // Créer le compte auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: defaultPassword,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          default_password: defaultPassword,
          account_type: 'teacher'
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('Erreur lors de la création du compte');

    // Créer l'enseignant dans la base de données
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert([{
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        bio: bio,
        user_id: authData.user.id,
        school_id: school.id,
        default_password: defaultPassword
      }])
      .select()
      .single();

    if (teacherError) throw teacherError;

    // Créer le profil utilisateur
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: authData.user.id,
        type: 'teacher'
      }]);

    if (profileError) throw profileError;

    // Envoyer un email avec les identifiants
    try {
      await sendPasswordEmail(
        email,
        firstName,
        lastName,
        defaultPassword,
        'teacher'
      );
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
    }

    return { 
      userId: teacher.id, 
      defaultPassword,
      exists: false,
      message: 'Compte enseignant créé avec succès. Un email a été envoyé avec les informations de connexion.'
    };
  } catch (error) {
    console.error('Error creating teacher account:', error);
    throw error;
  }
}

// Fonction pour vérifier le type de compte
export async function getUserType(): Promise<AuthType | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('type')
      .eq('user_id', user.id)
      .single();

    return profile?.type as AuthType || null;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
}
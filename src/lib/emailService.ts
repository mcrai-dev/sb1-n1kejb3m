import { supabase } from './supabase';

interface EmailData {
  to: string;
  subject: string;
  content: string;
}

export const sendEmail = async (data: EmailData) => {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: data.to,
        subject: data.subject,
        content: data.content,
        from: 'laydamcrai@gmail.com'
      }
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const sendPasswordEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  accountType: 'student' | 'teacher'
) => {
  const subject = `Vos identifiants de connexion ${accountType === 'student' ? 'étudiant' : 'enseignant'}`;
  
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6d28d9; margin: 0;">EduAI</h1>
          <p style="color: #6b7280; margin-top: 5px;">Votre assistant d'apprentissage intelligent</p>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Bienvenue sur EduAI</h2>
          
          <p>Bonjour ${firstName} ${lastName},</p>
          
          <p>Votre compte ${accountType === 'student' ? 'étudiant' : 'enseignant'} a été créé avec succès. Vous pouvez dès maintenant vous connecter à votre espace personnel.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-weight: bold; margin: 0 0 15px 0;">Vos identifiants de connexion :</p>
            <div style="margin-left: 15px;">
              <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Mot de passe :</strong> ${password}</p>
            </div>
          </div>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #dc2626; font-weight: bold; margin: 0;">Important :</p>
            <p style="margin: 10px 0 0 0;">Pour des raisons de sécurité, nous vous recommandons fortement de changer votre mot de passe lors de votre première connexion.</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">Cordialement,</p>
            <p style="margin: 5px 0 0 0;">L'équipe EduAI</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, content });
};
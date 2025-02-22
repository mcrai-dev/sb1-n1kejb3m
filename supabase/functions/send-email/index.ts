import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, content, from } = await req.json();

    // Validation des données
    if (!to || !subject || !content || !from) {
      throw new Error('Missing required fields');
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || !emailRegex.test(from)) {
      throw new Error('Invalid email format');
    }

    const client = new SmtpClient();

    try {
      // Configuration Gmail
      await client.connectTLS({
        hostname: 'smtp.gmail.com',
        port: 465, // Utiliser le port 465 pour SSL
        username: from,
        password: Deno.env.get('GMAIL_APP_PASSWORD') || '',
      });

      // Envoi de l'email avec timeout
      await Promise.race([
        client.send({
          from,
          to,
          subject,
          html: content,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout')), 30000)
        )
      ]);

      await client.close();

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Email sent successfully'
        }),
        {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200,
        },
      );
    } catch (error) {
      console.error('SMTP Error:', error);
      
      // Fermer le client en cas d'erreur
      try {
        await client.close();
      } catch {
        // Ignorer les erreurs de fermeture
      }
      throw error;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500,
      },
    );
  }
});
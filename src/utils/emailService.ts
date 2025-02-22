import { SchoolInfo } from '../types';

export const sendConfirmationEmail = async (schoolInfo: SchoolInfo) => {
  try {
    // Simulate email sending (replace with actual email service)
    console.log('Sending confirmation email to:', schoolInfo.email);
    
    // In a real implementation, you would use a proper email service
    // For now, we'll simulate a successful email send
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF attachment with school information
    const pdfContent = `
      Attestation d'Enregistrement
      
      Établissement: ${schoolInfo.name}
      Type: ${schoolInfo.type}
      Directeur: ${schoolInfo.directorName}
      
      Adresse: ${schoolInfo.address}
      ${schoolInfo.postalCode} ${schoolInfo.city}
      
      Téléphone: ${schoolInfo.phone}
      Email: ${schoolInfo.email}
      
      Classes:
      ${schoolInfo.classes.map(c => `- ${c.name}: ${c.studentCount} élèves`).join('\n')}
      
      Total élèves: ${schoolInfo.classes.reduce((sum, c) => sum + c.studentCount, 0)}
      
      Préférences IA activées:
      ${Object.entries(schoolInfo.aiPreferences)
        .filter(([, enabled]) => enabled)
        .map(([pref]) => `- ${pref}`)
        .join('\n')}
    `;

    console.log('Generated PDF content:', pdfContent);

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
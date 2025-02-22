export function generateDefaultPassword(
  firstName: string,
  lastName: string,
  registrationNumber?: string
): string {
  // Nettoyer et formater le nom/prénom
  const cleanFirstName = firstName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .substring(0, 3);

  const cleanLastName = lastName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .substring(0, 3);

  // Générer des caractères aléatoires
  const specialChars = '!@#$%^&*-_+=';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  // Fonction utilitaire pour obtenir un caractère aléatoire d'une chaîne
  const getRandomChar = (str: string) => str[Math.floor(Math.random() * str.length)];

  // Générer au moins un caractère de chaque type pour assurer la complexité
  const randomSpecialChar = getRandomChar(specialChars);
  const randomUpperChar = getRandomChar(upperChars);
  const randomLowerChar = getRandomChar(lowerChars);
  const randomNumber = getRandomChar(numbers);

  // Construire les parties du mot de passe
  let parts = [
    cleanFirstName,
    cleanLastName,
    randomUpperChar,
    randomLowerChar,
    randomSpecialChar,
    randomNumber
  ];

  // Ajouter le numéro d'immatriculation s'il existe
  if (registrationNumber) {
    const cleanRegNum = registrationNumber.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4);
    parts.splice(2, 0, cleanRegNum);
  }

  // Ajouter des caractères aléatoires supplémentaires pour atteindre une longueur minimale
  while (parts.join('').length < 12) {
    const allChars = upperChars + lowerChars + numbers + specialChars;
    parts.push(getRandomChar(allChars));
  }

  // Mélanger les parties du mot de passe
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }

  return parts.join('');
}
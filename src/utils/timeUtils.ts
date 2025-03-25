/**
 * Utilitaires pour la gestion du temps et des durées dans l'application
 */

/**
 * Convertit une durée au format HH:MM:SS ou MM:SS ou secondes en secondes
 * @param duration La durée à convertir
 * @returns La durée en secondes
 */
export const convertDurationToSeconds = (duration?: string): number => {
  if (!duration) return 0;
  
  // Nettoyer la chaîne (supprimer les espaces, les caractères non numériques sauf :)
  const cleanDuration = duration.trim().replace(/[^\d:\.]/g, '');
  
  // Si c'est déjà un nombre, le retourner directement
  if (!isNaN(Number(cleanDuration))) {
    console.log(`Durée convertie (nombre): ${cleanDuration} -> ${Number(cleanDuration)}`);
    return Number(cleanDuration);
  }
  
  // Format HH:MM:SS ou MM:SS
  const parts = cleanDuration.split(':').map(part => parseInt(part, 10));
  
  // Vérifier si les parts sont valides (pas de NaN)
  const validParts = parts.filter(part => !isNaN(part));
  if (validParts.length !== parts.length) {
    console.warn(`Parties de durée invalides: ${parts.join(':')}`);
    return 0;
  }
  
  let seconds = 0;
  
  if (parts.length === 3) {
    // Format HH:MM:SS (le plus courant pour les podcasts)
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    console.log(`Durée convertie (HH:MM:SS): ${cleanDuration} -> ${seconds}s`);
  } else if (parts.length === 2) {
    // Format MM:SS
    seconds = parts[0] * 60 + parts[1];
    console.log(`Durée convertie (MM:SS): ${cleanDuration} -> ${seconds}s`);
  } else if (parts.length === 1) {
    // Format SS
    seconds = parts[0];
    console.log(`Durée convertie (SS): ${cleanDuration} -> ${seconds}s`);
  }
  
  // Si la durée est déraisonnablement longue (plus de 24 heures), c'est probablement une erreur
  if (seconds > 86400) {
    console.warn(`Durée suspecte (>24h): ${cleanDuration} -> ${seconds}s`);
  }
  
  // Si la durée est toujours 0, essayer d'autres formats
  if (seconds === 0 && cleanDuration) {
    // Certains flux utilisent des formats comme "1 h 30 min" ou "1h30m"
    const hourMatch = /(\d+)\s*h/i.exec(duration);
    const minuteMatch = /(\d+)\s*m(?:in)?/i.exec(duration);
    const secondMatch = /(\d+)\s*s(?:ec)?/i.exec(duration);
    
    if (hourMatch) seconds += parseInt(hourMatch[1], 10) * 3600;
    if (minuteMatch) seconds += parseInt(minuteMatch[1], 10) * 60;
    if (secondMatch) seconds += parseInt(secondMatch[1], 10);
    
    if (seconds > 0) {
      console.log(`Durée convertie (format texte): ${duration} -> ${seconds}s`);
    }
  }
  
  return seconds;
};

/**
 * Formate un nombre de secondes en chaîne de caractères au format HH:MM:SS ou MM:SS
 * @param seconds Nombre de secondes à formater
 * @param includeHours Forcer l'inclusion des heures même si elles sont à 0
 * @returns Chaîne formatée
 */
export const formatTime = (seconds: number, includeHours: boolean = false): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  // Arrondir les secondes pour éviter les problèmes de précision
  seconds = Math.floor(seconds);
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  // Si la durée dépasse une heure ou si includeHours est true, inclure les heures
  if (hours > 0 || includeHours) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  
  // Sinon, format MM:SS
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

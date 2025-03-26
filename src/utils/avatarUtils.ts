/**
 * Utilitaires pour gérer les avatars dans l'application podKids
 */

/**
 * Obtient l'image d'avatar en fonction de l'index
 * @param index - Index de l'avatar (1-7)
 * @returns Image source pour React Native
 */
export const getAvatarImage = (index: number) => {
  // Les avatars sont numérotés de 1 à 7 dans le dossier assets/avatar
  switch (index) {
    case 1:
      return require('../../assets/avatar/avatar-1.webp');
    case 2:
      return require('../../assets/avatar/avatar-3.webp');
    case 3:
      return require('../../assets/avatar/avatar-4.webp');
    case 4:
      return require('../../assets/avatar/avatar-5.webp');
    case 5:
      return require('../../assets/avatar/avatar-6.webp');
    case 6:
      return require('../../assets/avatar/avatar-7.webp');
    default:
      return require('../../assets/avatar/avatar-2.webp'); // Avatar par défaut
  }
};

/**
 * Obtient le nombre total d'avatars disponibles
 * @returns Nombre d'avatars disponibles
 */
export const getTotalAvatars = (): number => {
  return 7; // Nombre d'avatars dans le dossier assets/avatar
};

/**
 * Génère un tableau d'indices d'avatars disponibles
 * @returns Tableau d'indices d'avatars
 */
export const getAvatarIndices = (): number[] => {
  return [0, 1, 2, 3, 4, 5, 6]; // 0 est l'avatar par défaut, 1-7 sont les nouveaux avatars
};

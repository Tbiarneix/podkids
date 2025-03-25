import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utilitaires pour la gestion du stockage local
 */
export class StorageUtils {
  /**
   * Vide complètement le contenu d'AsyncStorage
   * @returns Promise<void>
   */
  static async clearAllStorage(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('AsyncStorage a été complètement vidé avec succès!');
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors du nettoyage d\'AsyncStorage:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Liste toutes les clés stockées dans AsyncStorage
   * @returns Promise<string[]> Liste des clés
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('Clés stockées dans AsyncStorage:', keys);
      // Convertir le readonly array en array mutable
      return [...keys];
    } catch (error) {
      console.error('Erreur lors de la récupération des clés:', error);
      return [];
    }
  }

  /**
   * Affiche le contenu complet d'AsyncStorage dans la console
   * @returns Promise<void>
   */
  static async debugStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      // Convertir le readonly array en array mutable pour multiGet
      const items = await AsyncStorage.multiGet([...keys]);
      
      console.log('=== CONTENU ASYNCSTORAGE ===');
      items.forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      console.log('===========================');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors du debug d\'AsyncStorage:', error);
      return Promise.reject(error);
    }
  }
}

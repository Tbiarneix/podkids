import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const PIN_STORAGE_KEY = 'PIN_CODE';

/**
 * Service pour gérer le stockage et la vérification du code PIN
 */
export class PinService {
  /**
   * Stocke un nouveau code PIN
   * @param pin Le code PIN à stocker (sera haché)
   * @returns Promise<void>
   */
  static async storePin(pin: string): Promise<void> {
    try {
      const hashedPin = await this.hashPin(pin);
      await AsyncStorage.setItem(PIN_STORAGE_KEY, hashedPin);
    } catch (error) {
      console.error('Erreur lors du stockage du PIN:', error);
      throw new Error('Impossible de stocker le code PIN');
    }
  }

  /**
   * Vérifie si le code PIN fourni correspond au code PIN stocké
   * @param pin Le code PIN à vérifier
   * @returns Promise<boolean> true si le PIN est correct, false sinon
   */
  static async verifyPin(pin: string): Promise<boolean> {
    try {
      const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      
      if (!storedPin) {
        console.warn('Aucun PIN stocké trouvé');
        return false;
      }
      
      const hashedPin = await this.hashPin(pin);
      return hashedPin === storedPin;
    } catch (error) {
      console.error('Erreur lors de la vérification du PIN:', error);
      throw new Error('Impossible de vérifier le code PIN');
    }
  }

  /**
   * Vérifie si un code PIN est déjà configuré
   * @returns Promise<boolean> true si un PIN est configuré, false sinon
   */
  static async isPinConfigured(): Promise<boolean> {
    try {
      const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      return storedPin !== null;
    } catch (error) {
      console.error('Erreur lors de la vérification de la configuration du PIN:', error);
      return false;
    }
  }

  /**
   * Supprime le code PIN stocké
   * @returns Promise<void>
   */
  static async removePin(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PIN_STORAGE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression du PIN:', error);
      throw new Error('Impossible de supprimer le code PIN');
    }
  }

  /**
   * Hache un code PIN avec SHA-256
   * @param pin Le code PIN à hacher
   * @returns Promise<string> Le PIN haché
   */
  private static async hashPin(pin: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
  }
}

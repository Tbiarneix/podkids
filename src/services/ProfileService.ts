import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { Profile, ProfileFormData } from '../types/profile';

// Clé pour stocker les profils dans AsyncStorage
const PROFILES_STORAGE_KEY = 'profiles';

export class ProfileService {
  /**
   * Récupère tous les profils
   */
  static async getProfiles(): Promise<Profile[]> {
    try {
      const profilesJson = await AsyncStorage.getItem(PROFILES_STORAGE_KEY);
      return profilesJson ? JSON.parse(profilesJson) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des profils:', error);
      return [];
    }
  }

  /**
   * Récupère un profil par son ID
   */
  static async getProfileById(id: string): Promise<Profile | null> {
    try {
      const profiles = await this.getProfiles();
      return profiles.find(profile => profile.id === id) || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du profil ${id}:`, error);
      return null;
    }
  }

  /**
   * Crée un nouveau profil
   */
  static async createProfile(profileData: ProfileFormData): Promise<Profile> {
    try {
      const profiles = await this.getProfiles();
      
      const newProfile: Profile = {
        id: uuidv4(),
        ...profileData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const updatedProfiles = [...profiles, newProfile];
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
      
      return newProfile;
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      throw error;
    }
  }

  /**
   * Met à jour un profil existant
   */
  static async updateProfile(id: string, profileData: Partial<ProfileFormData>): Promise<Profile | null> {
    try {
      const profiles = await this.getProfiles();
      const profileIndex = profiles.findIndex(profile => profile.id === id);
      
      if (profileIndex === -1) {
        console.error(`Profil avec l'ID ${id} non trouvé`);
        return null;
      }
      
      const updatedProfile: Profile = {
        ...profiles[profileIndex],
        ...profileData,
        updatedAt: Date.now(),
      };
      
      profiles[profileIndex] = updatedProfile;
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
      
      return updatedProfile;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du profil ${id}:`, error);
      return null;
    }
  }

  /**
   * Supprime un profil
   */
  static async deleteProfile(id: string): Promise<boolean> {
    try {
      const profiles = await this.getProfiles();
      const updatedProfiles = profiles.filter(profile => profile.id !== id);
      
      if (profiles.length === updatedProfiles.length) {
        console.error(`Profil avec l'ID ${id} non trouvé`);
        return false;
      }
      
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du profil ${id}:`, error);
      return false;
    }
  }
}
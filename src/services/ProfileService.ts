import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, ProfileFormData } from '../types/profile';

const PROFILES_STORAGE_KEY = 'PROFILES';

// Fonction pour générer un ID unique simple
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export class ProfileService {
  /**
   * Récupère tous les profils stockés
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
      
      const now = Date.now();
      const newProfile: Profile = {
        id: generateUniqueId(),
        name: profileData.name,
        avatar: profileData.avatar,
        ageRanges: profileData.ageRanges,
        podcastTypes: profileData.podcastTypes,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedProfiles = [...profiles, newProfile];
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
      
      return newProfile;
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      throw new Error('Impossible de créer le profil');
    }
  }

  /**
   * Met à jour un profil existant
   */
  static async updateProfile(id: string, profileData: Partial<ProfileFormData>): Promise<Profile> {
    try {
      const profiles = await this.getProfiles();
      const profileIndex = profiles.findIndex(profile => profile.id === id);
      
      if (profileIndex === -1) {
        throw new Error(`Profil avec l'ID ${id} non trouvé`);
      }
      
      const updatedProfile: Profile = {
        ...profiles[profileIndex],
        ...profileData,
        updatedAt: Date.now()
      };
      
      profiles[profileIndex] = updatedProfile;
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
      
      return updatedProfile;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du profil ${id}:`, error);
      throw new Error('Impossible de mettre à jour le profil');
    }
  }

  /**
   * Supprime un profil
   */
  static async deleteProfile(id: string): Promise<boolean> {
    try {
      const profiles = await this.getProfiles();
      const filteredProfiles = profiles.filter(profile => profile.id !== id);
      
      if (filteredProfiles.length === profiles.length) {
        return false; // Aucun profil n'a été supprimé
      }
      
      await AsyncStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(filteredProfiles));
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du profil ${id}:`, error);
      return false;
    }
  }
}

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, ActiveProfileContextType } from '../types/profile';

// Clé pour stocker l'ID du profil actif dans AsyncStorage
const ACTIVE_PROFILE_ID_KEY = 'activeProfileId';

// Valeur par défaut du contexte
const defaultContextValue: ActiveProfileContextType = {
  activeProfile: null,
  setActiveProfile: () => {},
  loadProfile: async () => {},
  clearActiveProfile: () => {},
  isLoading: true,
};

// Création du contexte
export const ActiveProfileContext = createContext<ActiveProfileContextType>(defaultContextValue);

// Hook personnalisé pour utiliser le contexte
export const useActiveProfile = () => useContext(ActiveProfileContext);

interface ActiveProfileProviderProps {
  children: ReactNode;
}

export const ActiveProfileProvider: React.FC<ActiveProfileProviderProps> = ({ children }) => {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fonction pour charger un profil par son ID
  const loadProfile = async (profileId: string) => {
    try {
      setIsLoading(true);
      // Récupérer les profils stockés
      const profilesJson = await AsyncStorage.getItem('profiles');
      
      if (profilesJson) {
        const profiles: Profile[] = JSON.parse(profilesJson);
        const profile = profiles.find(p => p.id === profileId);
        
        if (profile) {
          setActiveProfile(profile);
          // Sauvegarder l'ID du profil actif dans AsyncStorage
          await AsyncStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
        } else {
          console.error(`Profil avec l'ID ${profileId} non trouvé`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour effacer le profil actif
  const clearActiveProfile = async () => {
    setActiveProfile(null);
    try {
      await AsyncStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression du profil actif:', error);
    }
  };

  // Charger le profil actif au démarrage
  useEffect(() => {
    const loadActiveProfile = async () => {
      try {
        setIsLoading(true);
        const activeProfileId = await AsyncStorage.getItem(ACTIVE_PROFILE_ID_KEY);
        
        if (activeProfileId) {
          await loadProfile(activeProfileId);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil actif:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveProfile();
  }, []);

  // Valeur du contexte
  const contextValue: ActiveProfileContextType = {
    activeProfile,
    setActiveProfile,
    loadProfile,
    clearActiveProfile,
    isLoading,
  };

  return (
    <ActiveProfileContext.Provider value={contextValue}>
      {children}
    </ActiveProfileContext.Provider>
  );
};

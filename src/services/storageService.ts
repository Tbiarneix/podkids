import * as SecureStore from 'expo-secure-store';
import { Podcast } from '../types/podcast';

const PODCASTS_STORAGE_KEY = 'podkids_podcasts';

export const savePodcasts = async (podcasts: Podcast[]): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      PODCASTS_STORAGE_KEY,
      JSON.stringify(podcasts)
    );
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des podcasts:', error);
    throw error;
  }
};

export const getPodcasts = async (): Promise<Podcast[]> => {
  try {
    const podcastsJson = await SecureStore.getItemAsync(PODCASTS_STORAGE_KEY);
    return podcastsJson ? JSON.parse(podcastsJson) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des podcasts:', error);
    return [];
  }
};

export const exportPodcastsToJson = async (): Promise<string> => {
  const podcasts = await getPodcasts();
  return JSON.stringify(podcasts, null, 2);
};

export const importPodcastsFromJson = async (jsonString: string): Promise<boolean> => {
  try {
    const podcasts = JSON.parse(jsonString) as Podcast[];
    await savePodcasts(podcasts);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'importation des podcasts:', error);
    return false;
  }
};

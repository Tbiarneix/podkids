import AsyncStorage from '@react-native-async-storage/async-storage';
import * as rssParser from 'react-native-rss-parser';
import { Podcast, Episode, PodcastType, AgeRange, EpisodeStatus } from '../types/podcast';

const PODCASTS_STORAGE_KEY = '@podkids:podcasts';

// Fonction pour générer un ID unique compatible avec React Native
const generateUniqueId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class PodcastService {
  /**
   * Récupère tous les podcasts stockés
   */
  static async getPodcasts(): Promise<Podcast[]> {
    try {
      const podcastsJson = await AsyncStorage.getItem(PODCASTS_STORAGE_KEY);
      return podcastsJson ? JSON.parse(podcastsJson) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des podcasts:', error);
      return [];
    }
  }

  /**
   * Récupère un podcast par son ID
   */
  static async getPodcastById(id: string): Promise<Podcast | null> {
    try {
      const podcasts = await this.getPodcasts();
      return podcasts.find(podcast => podcast.id === id) || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du podcast ${id}:`, error);
      return null;
    }
  }

  /**
   * Vérifie si un podcast avec l'URL donnée existe déjà
   */
  static async podcastExistsByUrl(url: string): Promise<boolean> {
    try {
      const podcasts = await this.getPodcasts();
      return podcasts.some(podcast => podcast.url === url);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'existence du podcast:', error);
      return false;
    }
  }

  /**
   * Récupère et parse un flux RSS
   */
  static async fetchRssFeed(url: string): Promise<rssParser.Feed> {
    try {
      // Ajouter https:// si l'URL n'a pas de protocole
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Récupérer le contenu du flux
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Convertir la réponse en texte
      const responseText = await response.text();
      
      if (responseText.length === 0) {
        throw new Error('Le flux RSS est vide');
      }
      
      // Parser le texte en flux RSS
      try {
        const feed = await rssParser.parse(responseText);
        return feed;
      } catch (parseError) {
        throw new Error(`Erreur de parsing du flux RSS: ${parseError instanceof Error ? parseError.message : 'Format non reconnu'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du flux RSS:', error);
      throw error;
    }
  }

  /**
   * Ajoute un nouveau podcast à partir d'une URL RSS
   * @param url URL du flux RSS du podcast
   * @param ageRanges Tranches d'âge du podcast
   * @param podcastTypes Types de podcast
   * @returns Le podcast ajouté
   */
  static async addPodcast(
    url: string, 
    ageRanges: AgeRange[], 
    podcastTypes: PodcastType[]
  ): Promise<Podcast> {
    try {
      // Vérifier si le podcast existe déjà
      const exists = await this.podcastExistsByUrl(url);
      if (exists) {
        throw new Error('Ce podcast existe déjà dans votre bibliothèque');
      }

      // Récupérer le flux RSS
      const feed = await this.fetchRssFeed(url);
      
      // Récupérer les podcasts existants
      const podcasts = await this.getPodcasts();
      
      // Créer le nouveau podcast
      const newPodcast: Podcast = {
        id: generateUniqueId(),
        name: feed.title || 'Podcast sans titre',
        description: feed.description || '',
        cover: feed.image?.url || '',
        url: url,
        types: podcastTypes,
        ageRanges: ageRanges,
        subscription: true,
        episodes: feed.items.map((item: rssParser.FeedItem) => ({
          id: generateUniqueId(),
          name: item.title || 'Épisode sans titre',
          description: item.description || '',
          cover: item.itunes?.image || feed.image?.url || '',
          url: item.enclosures?.[0]?.url || '',
          duration: item.itunes?.duration ? parseInt(item.itunes.duration) || 0 : 0,
          status: EpisodeStatus.TO_LISTEN,
          timestamp: 0,
          publicationDate: item.published ? new Date(item.published).getTime() : Date.now()
        }))
      };
      
      // Ajouter le nouveau podcast à la liste
      podcasts.push(newPodcast);
      
      // Enregistrer la liste mise à jour
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
      
      return newPodcast;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du podcast:', error);
      throw error;
    }
  }

  /**
   * Met à jour un podcast existant
   * @param podcastId ID du podcast à mettre à jour
   * @param updates Mises à jour à appliquer au podcast
   * @returns Le podcast mis à jour
   */
  static async updatePodcast(
    podcastId: string, 
    updates: { 
      name?: string; 
      description?: string; 
      cover?: string;
      types?: PodcastType[];
      ageRanges?: AgeRange[];
      subscription?: boolean;
    }
  ): Promise<Podcast | null> {
    try {
      const podcasts = await this.getPodcasts();
      const index = podcasts.findIndex(p => p.id === podcastId);
      
      if (index === -1) {
        throw new Error('Podcast non trouvé');
      }

      podcasts[index] = { ...podcasts[index], ...updates };
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));

      return podcasts[index];
    } catch (error) {
      console.error('Erreur lors de la mise à jour du podcast:', error);
      throw error;
    }
  }

  /**
   * Supprime un podcast par son ID
   */
  static async deletePodcast(id: string): Promise<void> {
    try {
      const podcasts = await this.getPodcasts();
      const updatedPodcasts = podcasts.filter(podcast => podcast.id !== id);
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(updatedPodcasts));
    } catch (error) {
      console.error('Erreur lors de la suppression du podcast:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un épisode
   */
  static async updateEpisodeStatus(
    podcastId: string,
    episodeId: string,
    status: EpisodeStatus,
    timestamp: number
  ): Promise<void> {
    try {
      const podcasts = await this.getPodcasts();
      const podcastIndex = podcasts.findIndex(p => p.id === podcastId);
      
      if (podcastIndex === -1) {
        throw new Error('Podcast non trouvé');
      }

      const episodeIndex = podcasts[podcastIndex].episodes.findIndex(e => e.id === episodeId);
      
      if (episodeIndex === -1) {
        throw new Error('Épisode non trouvé');
      }

      podcasts[podcastIndex].episodes[episodeIndex].status = status;
      podcasts[podcastIndex].episodes[episodeIndex].timestamp = timestamp;

      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'épisode:', error);
      throw error;
    }
  }

  /**
   * Rafraîchit les épisodes d'un podcast à partir de son flux RSS
   */
  static async refreshPodcastEpisodes(podcastId: string): Promise<Podcast> {
    try {
      const podcasts = await this.getPodcasts();
      const podcastIndex = podcasts.findIndex(p => p.id === podcastId);
      
      if (podcastIndex === -1) {
        throw new Error('Podcast non trouvé');
      }

      const podcast = podcasts[podcastIndex];
      const feed = await this.fetchRssFeed(podcast.url);

      // Créer un map des épisodes existants pour conserver leur statut
      const existingEpisodes = new Map();
      podcast.episodes.forEach(episode => {
        existingEpisodes.set(episode.name, episode);
      });

      // Mettre à jour les épisodes
      podcast.episodes = feed.items.map((item: rssParser.FeedItem) => {
        const existingEpisode = existingEpisodes.get(item.title);
        
        if (existingEpisode) {
          // Conserver le statut et le timestamp des épisodes existants
          return {
            ...existingEpisode,
            description: item.description || existingEpisode.description,
            cover: item.itunes?.image || feed.image?.url || existingEpisode.cover,
            url: item.enclosures?.[0]?.url || existingEpisode.url || '',
            duration: item.itunes?.duration ? parseInt(item.itunes.duration) || existingEpisode.duration : existingEpisode.duration,
            publicationDate: item.published ? new Date(item.published).getTime() : existingEpisode.publicationDate
          };
        } else {
          // Créer un nouvel épisode
          return {
            id: generateUniqueId(),
            name: item.title || 'Épisode sans titre',
            description: item.description || '',
            cover: item.itunes?.image || feed.image?.url || '',
            url: item.enclosures?.[0]?.url || '',
            duration: item.itunes?.duration ? parseInt(item.itunes.duration) || 0 : 0,
            status: EpisodeStatus.TO_LISTEN,
            timestamp: 0,
            publicationDate: item.published ? new Date(item.published).getTime() : Date.now()
          };
        }
      });

      // Mettre à jour les informations du podcast
      podcast.name = feed.title || podcast.name;
      podcast.description = feed.description || podcast.description;
      podcast.cover = feed.image?.url || podcast.cover;

      // Sauvegarder les modifications
      podcasts[podcastIndex] = podcast;
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));

      return podcast;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des épisodes:', error);
      throw error;
    }
  }
}

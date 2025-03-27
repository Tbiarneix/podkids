import AsyncStorage from '@react-native-async-storage/async-storage';
import { RssParserService, RssFeed, RssFeedItem } from './RssParserService';
import { Podcast, Episode, PodcastType, AgeRange, EpisodeStatus } from '../types/podcast';
import { convertDurationToSeconds } from '../utils/timeUtils';
import libraryData from '../data/library.json';

const PODCASTS_STORAGE_KEY = '@podkids:podcasts';

// Fonction pour générer un ID unique compatible avec React Native
const generateUniqueId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Convertit une durée au format HH:MM:SS ou MM:SS ou secondes en secondes
 * @param duration La durée à convertir
 * @returns La durée en secondes
 */
// const convertDurationToSeconds = (duration?: string): number => {
//   if (!duration) return 0;
  
//   // Si c'est déjà un nombre, le retourner directement
//   if (!isNaN(Number(duration))) {
//     return Number(duration);
//   }
  
//   // Format HH:MM:SS ou MM:SS
//   const parts = duration.split(':').map(part => parseInt(part, 10));
  
//   if (parts.length === 3) {
//     // Format HH:MM:SS
//     return parts[0] * 3600 + parts[1] * 60 + parts[2];
//   } else if (parts.length === 2) {
//     // Format MM:SS
//     return parts[0] * 60 + parts[1];
//   }
  
//   // Si le format n'est pas reconnu, retourner 0
//   return 0;
// };

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
  static async fetchRssFeed(url: string): Promise<RssFeed> {
    try {
      // Utiliser le service RssParser pour récupérer et parser le flux RSS
      const feed = await RssParserService.parseRssFeed(url);
      return feed;
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
        cover: feed.imageUrl || feed.itunesImage || '',
        url: url,
        author: feed.itunesOwnerName || feed.itunesAuthor || 'Auteur inconnu',
        types: podcastTypes,
        ageRanges: ageRanges,
        subscription: false,
        deleteable: true, // Les podcasts ajoutés par l'utilisateur sont toujours supprimables
        episodes: feed.items.map((item: RssFeedItem) => ({
          id: generateUniqueId(),
          name: item.title || 'Épisode sans titre',
          description: item.description || item.contentEncoded || item.content || '',
          cover: item.itunesImage || feed.imageUrl || feed.itunesImage || '',
          url: item.enclosureUrl || '',
          duration: convertDurationToSeconds(item.itunesDuration),
          status: EpisodeStatus.TO_LISTEN,
          timestamp: 0,
          publicationDate: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
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
      author?: string;
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
    timestamp?: number
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

      // Mettre à jour le statut de l'épisode
      podcasts[podcastIndex].episodes[episodeIndex].status = status;
      
      // Mettre à jour le timestamp si fourni
      if (timestamp !== undefined) {
        podcasts[podcastIndex].episodes[episodeIndex].timestamp = timestamp;
      }

      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'épisode:', error);
      throw error;
    }
  }

  /**
   * Met à jour la position de lecture d'un épisode
   */
  static async updateEpisodeTimestamp(
    podcastId: string,
    episodeId: string,
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
      
      podcasts[podcastIndex].episodes[episodeIndex].timestamp = timestamp;
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position de lecture:', error);
      throw error;
    }
  }

  /**
   * Rafraîchit les épisodes d'un podcast à partir de son flux RSS
   */
  static async refreshPodcastEpisodes(podcastId: string): Promise<Podcast | null> {
    try {
      const podcasts = await this.getPodcasts();
      const podcastIndex = podcasts.findIndex(p => p.id === podcastId);
      
      if (podcastIndex === -1) {
        throw new Error('Podcast non trouvé');
      }
      
      const podcast = podcasts[podcastIndex];
      
      // Récupérer le flux RSS mis à jour
      const feed = await this.fetchRssFeed(podcast.url);
      
      // Créer une map des épisodes existants pour préserver leurs statuts
      const existingEpisodes = new Map<string | undefined, Episode>();
      podcast.episodes.forEach(episode => {
        existingEpisodes.set(episode.name, episode);
      });

      // Mettre à jour les épisodes
      podcast.episodes = feed.items.map((item: RssFeedItem) => {
        const existingEpisode = existingEpisodes.get(item.title);
        
        if (existingEpisode) {
          return {
            ...existingEpisode,
            description: item.description || item.contentEncoded || item.content || existingEpisode.description,
            cover: item.itunesImage || feed.imageUrl || existingEpisode.cover,
            url: item.enclosureUrl || existingEpisode.url || '',
            duration: convertDurationToSeconds(item.itunesDuration),
            publicationDate: item.pubDate ? new Date(item.pubDate).getTime() : existingEpisode.publicationDate
          };
        } else {
          // Créer un nouvel épisode
          return {
            id: generateUniqueId(),
            name: item.title || 'Épisode sans titre',
            description: item.description || item.contentEncoded || item.content || '',
            cover: item.itunesImage || feed.imageUrl || '',
            url: item.enclosureUrl || '',
            duration: convertDurationToSeconds(item.itunesDuration),
            status: EpisodeStatus.TO_LISTEN,
            timestamp: 0,
            publicationDate: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
          };
        }
      });
      
      // Mettre à jour les podcasts
      podcasts[podcastIndex] = podcast;
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
      
      return podcast;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des épisodes:', error);
      throw error;
    }
  }

  /**
   * Récupère les podcasts par tranche d'âge
   */
  static async getPodcastsByAgeRange(ageRange: AgeRange): Promise<Podcast[]> {
    try {
      const podcasts = await this.getPodcasts();
      return podcasts.filter(podcast => podcast.ageRanges.includes(ageRange));
    } catch (error) {
      console.error('Erreur lors de la récupération des podcasts par tranche d\'âge:', error);
      return [];
    }
  }

  /**
   * Récupère les podcasts par type
   */
  static async getPodcastsByType(type: PodcastType): Promise<Podcast[]> {
    try {
      const podcasts = await this.getPodcasts();
      return podcasts.filter(podcast => podcast.types.includes(type));
    } catch (error) {
      console.error('Erreur lors de la récupération des podcasts par type:', error);
      return [];
    }
  }

  /**
   * Récupère les podcasts par tranche d'âge et type
   */
  static async getPodcastsByAgeRangeAndType(ageRange: AgeRange, type: PodcastType): Promise<Podcast[]> {
    try {
      const podcasts = await this.getPodcasts();
      return podcasts.filter(
        podcast => podcast.ageRanges.includes(ageRange) && podcast.types.includes(type)
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des podcasts par tranche d\'âge et type:', error);
      return [];
    }
  }

  /**
   * Récupère les podcasts favoris
   * @returns Liste des podcasts favoris
   */
  static async getFavoritePodcasts(): Promise<Podcast[]> {
    try {
      const podcasts = await this.getPodcasts();
      return podcasts.filter(podcast => podcast.subscription);
    } catch (error) {
      console.error('Erreur lors de la récupération des podcasts favoris:', error);
      return [];
    }
  }

  /**
   * Vérifie si la bibliothèque de podcasts est vide et la remplit avec les podcasts par défaut si nécessaire
   * @returns true si la bibliothèque a été initialisée, false si elle contenait déjà des podcasts
   */
  static async initializeDefaultPodcasts(): Promise<boolean> {
    try {
      // Vérifier si des podcasts existent déjà
      const podcasts = await this.getPodcasts();
      if (podcasts.length > 0) {
        console.log('La bibliothèque de podcasts contient déjà des podcasts, pas d\'initialisation nécessaire');
        return false;
      }

      console.log('Initialisation de la bibliothèque de podcasts avec les podcasts par défaut...');
      
      // Parcourir les données de la bibliothèque et ajouter chaque podcast
      const addedPodcasts: Podcast[] = [];
      const errors: string[] = [];

      // Traiter chaque podcast dans la bibliothèque
      for (const podcastData of libraryData) {
        try {
          // Convertir les tranches d'âge du format JSON en enum AgeRange
          const ageRanges: AgeRange[] = [];
          for (const ageRangeKey of podcastData.AgeRange) {
            // Convertir la clé de l'enum en valeur de l'enum
            if (ageRangeKey in AgeRange) {
              ageRanges.push(AgeRange[ageRangeKey as keyof typeof AgeRange]);
            } else {
              console.warn(`Tranche d'âge inconnue: ${ageRangeKey}`);
            }
          }

          if (ageRanges.length === 0) {
            console.warn(`Aucune tranche d'âge valide pour le podcast: ${podcastData.name}`);
            continue;
          }

          // Convertir les types de podcast du format JSON en enum PodcastType
          const podcastTypes: PodcastType[] = [];
          for (const typeKey of podcastData.PodcastType) {
            // Vérifier si la clé existe dans l'enum PodcastType
            if (typeKey in PodcastType) {
              // Utiliser la clé pour accéder à l'enum directement
              podcastTypes.push(PodcastType[typeKey as keyof typeof PodcastType]);
            } else {
              console.warn(`Type de podcast inconnu: ${typeKey}`);
            }
          }

          if (podcastTypes.length === 0) {
            console.warn(`Aucun type de podcast valide pour le podcast: ${podcastData.name}`);
            continue;
          }

          // Récupérer le flux RSS
          const feed = await this.fetchRssFeed(podcastData.url);
          
          // Créer le nouveau podcast
          const newPodcast: Podcast = {
            id: generateUniqueId(),
            name: podcastData.name || feed.title || 'Podcast sans titre',
            description: feed.description || '',
            cover: feed.imageUrl || feed.itunesImage || '',
            url: podcastData.url,
            author: podcastData.author || feed.itunesOwnerName || feed.itunesAuthor || 'Auteur inconnu',
            types: podcastTypes,
            ageRanges: ageRanges,
            subscription: false,
            deleteable: podcastData.deleteable !== undefined ? podcastData.deleteable : true,
            episodes: feed.items.map((item: RssFeedItem) => ({
              id: generateUniqueId(),
              name: item.title || 'Épisode sans titre',
              description: item.description || item.contentEncoded || item.content || '',
              cover: item.itunesImage || feed.imageUrl || feed.itunesImage || '',
              url: item.enclosureUrl || '',
              duration: convertDurationToSeconds(item.itunesDuration),
              status: EpisodeStatus.TO_LISTEN,
              timestamp: 0,
              publicationDate: item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
            }))
          };
          
          // Ajouter le nouveau podcast à la liste
          addedPodcasts.push(newPodcast);
          
          // Enregistrer chaque podcast immédiatement pour éviter de perdre tout le travail en cas d'erreur
          const currentPodcasts = await this.getPodcasts();
          currentPodcasts.push(newPodcast);
          await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(currentPodcasts));
          
          console.log(`Podcast ajouté: ${newPodcast.name} (${podcastData.url})`);
        } catch (error) {
          // Ignorer les erreurs individuelles pour continuer avec les autres podcasts
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Erreur lors de l'ajout du podcast ${podcastData.name || podcastData.url}: ${errorMessage}`);
          errors.push(`${podcastData.name || podcastData.url}: ${errorMessage}`);
        }
      }

      console.log(`Initialisation terminée. ${addedPodcasts.length} podcasts ajoutés, ${errors.length} erreurs.`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des podcasts par défaut:', error);
      return false;
    }
  }
}

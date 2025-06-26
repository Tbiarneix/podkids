import AsyncStorage from '@react-native-async-storage/async-storage';
import { RssParserService, RssFeed, RssFeedItem } from './RssParserService';
import { Podcast, Episode, PodcastType, AgeRange, EpisodeStatus } from '../types/podcast';
import { convertDurationToSeconds } from '../utils/timeUtils';
import libraryData from '../data/library.json';

const PODCASTS_STORAGE_KEY = '@podkids:podcasts';
const PODCAST_IDS_KEY = '@podkids:podcast_ids';
const PODCAST_PREFIX = '@podkids:podcast:';

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
      // Récupérer la liste des IDs de podcasts
      const podcastIdsJson = await AsyncStorage.getItem(PODCAST_IDS_KEY);
      const podcastIds: string[] = podcastIdsJson ? JSON.parse(podcastIdsJson) : [];
      
      if (podcastIds.length === 0) {
        return [];
      }
      
      // Récupérer chaque podcast individuellement
      const podcasts: Podcast[] = [];
      for (const id of podcastIds) {
        const podcastJson = await AsyncStorage.getItem(`${PODCAST_PREFIX}${id}`);
        if (podcastJson) {
          podcasts.push(JSON.parse(podcastJson));
        }
      }
      
      return podcasts;
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
      const podcastJson = await AsyncStorage.getItem(`${PODCAST_PREFIX}${id}`);
      return podcastJson ? JSON.parse(podcastJson) : null;
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
      
      // Récupérer la liste des IDs de podcasts
      const podcastIdsJson = await AsyncStorage.getItem(PODCAST_IDS_KEY);
      const podcastIds: string[] = podcastIdsJson ? JSON.parse(podcastIdsJson) : [];
      
      // Ajouter le nouvel ID
      podcastIds.push(newPodcast.id);
      
      // Enregistrer l'ID et le podcast
      await AsyncStorage.setItem(PODCAST_IDS_KEY, JSON.stringify(podcastIds));
      await AsyncStorage.setItem(`${PODCAST_PREFIX}${newPodcast.id}`, JSON.stringify(newPodcast));
      
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
      const podcast = await this.getPodcastById(podcastId);
      
      if (!podcast) {
        throw new Error('Podcast non trouvé');
      }

      const updatedPodcast = { ...podcast, ...updates };
      await AsyncStorage.setItem(`${PODCAST_PREFIX}${podcastId}`, JSON.stringify(updatedPodcast));

      return updatedPodcast;
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
      // Récupérer la liste des IDs de podcasts
      const podcastIdsJson = await AsyncStorage.getItem(PODCAST_IDS_KEY);
      const podcastIds: string[] = podcastIdsJson ? JSON.parse(podcastIdsJson) : [];
      
      // Supprimer l'ID de la liste
      const updatedPodcastIds = podcastIds.filter(podcastId => podcastId !== id);
      
      // Mettre à jour la liste des IDs et supprimer le podcast
      await AsyncStorage.setItem(PODCAST_IDS_KEY, JSON.stringify(updatedPodcastIds));
      await AsyncStorage.removeItem(`${PODCAST_PREFIX}${id}`);
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
      const podcast = await this.getPodcastById(podcastId);
      
      if (!podcast) {
        throw new Error('Podcast non trouvé');
      }
      
      const episodeIndex = podcast.episodes.findIndex(e => e.id === episodeId);
      
      if (episodeIndex === -1) {
        throw new Error('Épisode non trouvé');
      }

      // Mettre à jour le statut de l'épisode
      podcast.episodes[episodeIndex].status = status;
      
      // Mettre à jour le timestamp si fourni
      if (timestamp !== undefined) {
        podcast.episodes[episodeIndex].timestamp = timestamp;
      }

      await AsyncStorage.setItem(`${PODCAST_PREFIX}${podcastId}`, JSON.stringify(podcast));
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
      const podcast = await this.getPodcastById(podcastId);
      
      if (!podcast) {
        throw new Error('Podcast non trouvé');
      }
      
      const episodeIndex = podcast.episodes.findIndex(e => e.id === episodeId);
      
      if (episodeIndex === -1) {
        throw new Error('Épisode non trouvé');
      }
      
      podcast.episodes[episodeIndex].timestamp = timestamp;
      await AsyncStorage.setItem(`${PODCAST_PREFIX}${podcastId}`, JSON.stringify(podcast));
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
      const podcast = await this.getPodcastById(podcastId);
      
      if (!podcast) {
        throw new Error('Podcast non trouvé');
      }
      
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
      
      // Mettre à jour le podcast
      await AsyncStorage.setItem(`${PODCAST_PREFIX}${podcastId}`, JSON.stringify(podcast));
      
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
      const podcastIdsJson = await AsyncStorage.getItem(PODCAST_IDS_KEY);
      const podcastIds: string[] = podcastIdsJson ? JSON.parse(podcastIdsJson) : [];
      
      if (podcastIds.length > 0) {
        console.log('La bibliothèque de podcasts contient déjà des podcasts, pas d\'initialisation nécessaire');
        return false;
      }

      console.log('Initialisation de la bibliothèque de podcasts avec les podcasts par défaut...');
      
      // Parcourir les données de la bibliothèque et ajouter chaque podcast
      const addedPodcastIds: string[] = [];
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
          
          // Ajouter le podcast individuellement
          await AsyncStorage.setItem(`${PODCAST_PREFIX}${newPodcast.id}`, JSON.stringify(newPodcast));
          addedPodcastIds.push(newPodcast.id);
          
          // Mettre à jour la liste des IDs après chaque ajout
          await AsyncStorage.setItem(PODCAST_IDS_KEY, JSON.stringify(addedPodcastIds));
          
          console.log(`Podcast ajouté: ${newPodcast.name} (${podcastData.url})`);
        } catch (error) {
          // Ignorer les erreurs individuelles pour continuer avec les autres podcasts
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Erreur lors de l'ajout du podcast ${podcastData.name || podcastData.url}: ${errorMessage}`);
          errors.push(`${podcastData.name || podcastData.url}: ${errorMessage}`);
        }
      }

      console.log(`Initialisation terminée. ${addedPodcastIds.length} podcasts ajoutés, ${errors.length} erreurs.`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des podcasts par défaut:', error);
      return false;
    }
  }

  /**
   * Initialise les podcasts pour les tranches d'âge spécifiées
   * @param ageRanges Les tranches d'âge pour lesquelles charger les podcasts
   * @returns Les podcasts chargés
   */
  static async initializePodcastsForAgeRanges(ageRanges: AgeRange[]): Promise<Podcast[]> {
    try {
      console.log('Initialisation des podcasts pour les tranches d\'âge:', ageRanges);
      
      // Filtrer les podcasts de la bibliothèque par tranches d'âge
      const filteredPodcasts = libraryData.filter(podcastData => {
        // Vérifier si au moins une tranche d'âge du podcast correspond aux tranches d'âge demandées
        return podcastData.AgeRange.some((ageRangeKey: string) => {
          // Convertir la clé de l'enum en valeur de l'enum
          if (ageRangeKey in AgeRange) {
            const ageRange = AgeRange[ageRangeKey as keyof typeof AgeRange];
            return ageRanges.includes(ageRange);
          }
          return false;
        });
      });
      
      console.log(`${filteredPodcasts.length} podcasts trouvés pour les tranches d'âge spécifiées`);
      
      // Récupérer les podcasts existants pour éviter les doublons
      const existingPodcasts = await this.getPodcasts();
      const existingUrls = new Set(existingPodcasts.map(p => p.url));
      
      // Podcasts à ajouter (ceux qui n'existent pas déjà)
      const podcastsToAdd = filteredPodcasts.filter(p => !existingUrls.has(p.url));
      console.log(`${podcastsToAdd.length} nouveaux podcasts à ajouter`);
      
      // Ajouter les nouveaux podcasts
      const addedPodcastIds: string[] = [];
      const addedPodcasts: Podcast[] = [];
      
      for (const podcastData of podcastsToAdd) {
        try {
          // Convertir les tranches d'âge du format JSON en enum AgeRange
          const podcastAgeRanges: AgeRange[] = [];
          for (const ageRangeKey of podcastData.AgeRange) {
            if (ageRangeKey in AgeRange) {
              podcastAgeRanges.push(AgeRange[ageRangeKey as keyof typeof AgeRange]);
            }
          }
          
          // Convertir les types de podcast du format JSON en enum PodcastType
          const podcastTypes: PodcastType[] = [];
          for (const typeKey of podcastData.PodcastType) {
            if (typeKey in PodcastType) {
              podcastTypes.push(PodcastType[typeKey as keyof typeof PodcastType]);
            }
          }
          
          // Récupérer le flux RSS
          const feed = await this.fetchRssFeed(podcastData.url);
          
          // Créer le nouveau podcast avec ses épisodes
          const newPodcast: Podcast = {
            id: generateUniqueId(),
            name: podcastData.name || feed.title || 'Podcast sans titre',
            description: feed.description || '',
            cover: feed.imageUrl || feed.itunesImage || '',
            url: podcastData.url,
            author: podcastData.author || feed.itunesOwnerName || feed.itunesAuthor || 'Auteur inconnu',
            types: podcastTypes,
            ageRanges: podcastAgeRanges,
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
            })),
            episodeCount: feed.items.length,
            hasEpisodesStored: true
          };
          
          // Stocker le podcast
          await AsyncStorage.setItem(`${PODCAST_PREFIX}${newPodcast.id}`, JSON.stringify(newPodcast));
          addedPodcastIds.push(newPodcast.id);
          addedPodcasts.push(newPodcast);
          
        } catch (error) {
          console.error(`Erreur lors de l'ajout du podcast ${podcastData.name}:`, error);
        }
      }
      
      // Mettre à jour la liste des IDs de podcasts
      const podcastIdsJson = await AsyncStorage.getItem(PODCAST_IDS_KEY);
      const podcastIds: string[] = podcastIdsJson ? JSON.parse(podcastIdsJson) : [];
      const updatedPodcastIds = [...podcastIds, ...addedPodcastIds];
      await AsyncStorage.setItem(PODCAST_IDS_KEY, JSON.stringify(updatedPodcastIds));
      
      console.log(`${addedPodcastIds.length} podcasts ajoutés avec succès`);
      
      // Retourner tous les podcasts pour les tranches d'âge spécifiées (existants + nouveaux)
      return [...existingPodcasts.filter(p => 
        p.ageRanges.some(age => ageRanges.includes(age))
      ), ...addedPodcasts];
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des podcasts par tranches d\'âge:', error);
      return [];
    }
  }
  
  /**
   * Supprime les podcasts qui ne correspondent plus aux tranches d'âge spécifiées
   * @param ageRanges Les tranches d'âge à conserver
   * @returns true si des podcasts ont été supprimés
   */
  static async removePodcastsNotInAgeRanges(ageRanges: AgeRange[]): Promise<boolean> {
    try {
      // Récupérer tous les podcasts
      const podcasts = await this.getPodcasts();
      
      // Filtrer les podcasts qui ne correspondent à aucune des tranches d'âge spécifiées
      const podcastsToRemove = podcasts.filter(podcast => 
        podcast.deleteable && // Ne supprimer que les podcasts supprimables
        !podcast.subscription && // Ne pas supprimer les podcasts favoris
        !podcast.ageRanges.some(age => ageRanges.includes(age)) // Aucune tranche d'âge en commun
      );
      
      if (podcastsToRemove.length === 0) {
        console.log('Aucun podcast à supprimer');
        return false;
      }
      
      console.log(`${podcastsToRemove.length} podcasts à supprimer`);
      
      // Supprimer chaque podcast
      for (const podcast of podcastsToRemove) {
        await this.deletePodcast(podcast.id);
      }
      
      console.log(`${podcastsToRemove.length} podcasts supprimés avec succès`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des podcasts:', error);
      return false;
    }
  }

  /**
   * Nettoie complètement toutes les données de podcasts
   * Utile en cas d'erreur "database or disk is full"
   */
  static async cleanAllPodcastData(): Promise<void> {
    try {
      console.log('Nettoyage de toutes les données de podcasts...');
      
      // Récupérer la liste des IDs de podcasts
      const podcastIdsJson = await AsyncStorage.getItem(PODCAST_IDS_KEY);
      const podcastIds: string[] = podcastIdsJson ? JSON.parse(podcastIdsJson) : [];
      
      // Supprimer chaque podcast individuellement
      for (const id of podcastIds) {
        await AsyncStorage.removeItem(`${PODCAST_PREFIX}${id}`);
      }
      
      // Supprimer la liste des IDs et l'ancienne clé de stockage
      await AsyncStorage.removeItem(PODCAST_IDS_KEY);
      await AsyncStorage.removeItem(PODCASTS_STORAGE_KEY);
      
      console.log('Nettoyage terminé. Toutes les données de podcasts ont été supprimées.');
    } catch (error) {
      console.error('Erreur lors du nettoyage des données de podcasts:', error);
      throw error;
    }
  }
}

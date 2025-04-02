import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import * as rssParser from 'react-native-rss-parser';
import { 
  Podcast, 
  Episode, 
  PodcastType, 
  AgeRange, 
  EpisodeStatus,
  PodcastSubscription,
  EpisodeState
} from '../types/podcast';

// Clés pour le stockage AsyncStorage
const PODCASTS_STORAGE_KEY = 'podcasts';

export class PodcastService {
  /**
   * Initialise les podcasts par défaut si nécessaire
   */
  static async initializeDefaultPodcasts(): Promise<void> {
    try {
      const podcasts = await this.getPodcasts();
      if (podcasts.length === 0) {
        // Aucun podcast n'est encore enregistré, on pourrait initialiser avec des podcasts par défaut
        // Pour l'instant, on ne fait rien
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des podcasts par défaut:', error);
    }
  }

  /**
   * Récupère tous les podcasts (sans les épisodes détaillés pour les non-abonnés)
   */
  static async getPodcasts(): Promise<Podcast[]> {
    try {
      const podcastsJson = await AsyncStorage.getItem(PODCASTS_STORAGE_KEY);
      const podcasts: Podcast[] = podcastsJson ? JSON.parse(podcastsJson) : [];
      return podcasts;
    } catch (error) {
      console.error('Erreur lors de la récupération des podcasts:', error);
      return [];
    }
  }

  /**
   * Récupère un podcast par son ID (sans charger les épisodes détaillés)
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
   * Récupère les épisodes d'un podcast en fonction du profil
   * Si le profil est abonné, récupère les épisodes stockés
   * Sinon, récupère les épisodes depuis le flux RSS sans les stocker
   */
  static async getPodcastEpisodes(podcastId: string, profileId: string): Promise<Episode[]> {
    try {
      const podcast = await this.getPodcastById(podcastId);
      if (!podcast) {
        throw new Error(`Podcast avec l'ID ${podcastId} non trouvé`);
      }

      // Vérifier si le profil est abonné au podcast
      const isSubscribed = podcast.subscription?.some(
        sub => sub.profileId === profileId && sub.subscription
      ) || false;

      // Si le profil est abonné et que les épisodes sont stockés, les renvoyer
      if (isSubscribed && podcast.episodes && podcast.episodes.length > 0) {
        return podcast.episodes;
      }

      // Sinon, charger les épisodes depuis le flux RSS
      return await this.fetchEpisodesFromRss(podcast.url);
    } catch (error) {
      console.error(`Erreur lors de la récupération des épisodes pour le podcast ${podcastId}:`, error);
      return [];
    }
  }

  /**
   * Récupère les épisodes d'un podcast depuis son flux RSS
   */
  static async fetchEpisodesFromRss(feedUrl: string): Promise<Episode[]> {
    try {
      // Récupérer le flux RSS
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      
      // Parser le flux RSS
      const feed = await rssParser.parse(responseText);
      
      // Convertir les items RSS en épisodes
      return feed.items.map(item => {
        // Extraire la durée à partir de la balise itunes:duration si elle existe
        let duration = 0;
        if (item.itunes?.duration) {
          // Si le format est HH:MM:SS
          if (item.itunes.duration.includes(':')) {
            const parts = item.itunes.duration.split(':').map(part => parseInt(part));
            if (parts.length === 3) {
              // HH:MM:SS
              duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              // MM:SS
              duration = parts[0] * 60 + parts[1];
            }
          } else {
            // Si c'est juste un nombre de secondes
            duration = parseInt(item.itunes.duration);
          }
        }

        return {
          id: uuidv4(), // Générer un ID unique pour l'épisode
          name: item.title,
          description: item.description || item.content || "",
          cover: item.itunes?.image || feed.image?.url || "",
          url: item.enclosures?.[0]?.url || item.links?.[0]?.url || "",
          duration: duration,
          status: [], // Aucun statut puisqu'il n'est pas encore écouté
          publicationDate: item.published ? new Date(item.published).getTime() : Date.now()
        } as Episode;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du flux RSS:', error);
      return [];
    }
  }

  /**
   * Récupère les métadonnées d'un podcast à partir de son URL RSS
   */
  static async fetchPodcastMetadata(feedUrl: string): Promise<Partial<Podcast>> {
    try {
      // Récupérer le flux RSS
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const responseText = await response.text();
      
      // Parser le flux RSS
      const feed = await rssParser.parse(responseText);
      
      // Extraire l'auteur du feed
      let author = "Auteur inconnu";
      if (feed.itunes?.owner?.name) {
        author = feed.itunes.owner.name;
      } else if (feed.authors && feed.authors.length > 0) {
        author = feed.authors[0].name || "Auteur inconnu";
      }
      
      // Extraire les métadonnées du podcast
      return {
        name: feed.title,
        description: feed.description,
        cover: feed.image?.url || feed.itunes?.image || "",
        url: feedUrl,
        author: author,
        episodes: [], // On ne stocke pas les épisodes ici
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées du podcast:', error);
      throw error;
    }
  }

  /**
   * Ajoute un nouveau podcast sans ses épisodes
   */
  static async addPodcast(
    feedUrl: string, 
    types: PodcastType[], 
    ageRanges: AgeRange[]
  ): Promise<Podcast> {
    try {
      const podcasts = await this.getPodcasts();
      
      // Vérifier si un podcast avec la même URL existe déjà
      const existingPodcast = podcasts.find(p => p.url === feedUrl);
      if (existingPodcast) {
        throw new Error('Un podcast avec cette URL existe déjà');
      }
      
      // Récupérer les métadonnées du podcast à partir de son URL RSS
      const podcastMetadata = await this.fetchPodcastMetadata(feedUrl);
      
      const newPodcast: Podcast = {
        id: uuidv4(),
        ...podcastMetadata as any, // Conversion de type nécessaire ici
        types,
        ageRanges,
        subscription: [],
        episodes: [],
        deleteable: true
      };
      
      const updatedPodcasts = [...podcasts, newPodcast];
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(updatedPodcasts));
      
      return newPodcast;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du podcast:', error);
      throw error;
    }
  }

  /**
   * Met à jour un podcast existant
   */
  static async updatePodcast(id: string, podcastData: Partial<Podcast>): Promise<Podcast | null> {
    try {
      const podcasts = await this.getPodcasts();
      const podcastIndex = podcasts.findIndex(podcast => podcast.id === id);
      
      if (podcastIndex === -1) {
        console.error(`Podcast avec l'ID ${id} non trouvé`);
        return null;
      }
      
      const updatedPodcast: Podcast = {
        ...podcasts[podcastIndex],
        ...podcastData,
      };
      
      podcasts[podcastIndex] = updatedPodcast;
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
      
      return updatedPodcast;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du podcast ${id}:`, error);
      return null;
    }
  }

  /**
   * Supprime un podcast
   */
  static async deletePodcast(id: string): Promise<boolean> {
    try {
      const podcasts = await this.getPodcasts();
      const podcastToDelete = podcasts.find(podcast => podcast.id === id);
      
      if (!podcastToDelete) {
        console.error(`Podcast avec l'ID ${id} non trouvé`);
        return false;
      }

      // Vérifier si le podcast est supprimable
      if (!podcastToDelete.deleteable) {
        console.error(`Le podcast ${id} n'est pas supprimable`);
        return false;
      }
      
      const updatedPodcasts = podcasts.filter(podcast => podcast.id !== id);
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(updatedPodcasts));
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du podcast ${id}:`, error);
      return false;
    }
  }

  /**
   * Gère l'abonnement à un podcast pour un profil spécifique
   * Met à jour les épisodes stockés si nécessaire
   */
  static async toggleSubscription(podcastId: string, profileId: string): Promise<boolean> {
    try {
      const podcasts = await this.getPodcasts();
      const podcastIndex = podcasts.findIndex(podcast => podcast.id === podcastId);
      
      if (podcastIndex === -1) {
        console.error(`Podcast avec l'ID ${podcastId} non trouvé`);
        return false;
      }
      
      const podcast = podcasts[podcastIndex];
      
      // Vérifier si le statut d'abonnement existe déjà pour ce profil
      const subscriptionIndex = podcast.subscription?.findIndex(
        sub => sub.profileId === profileId
      ) ?? -1;
      
      // Détermine si le profil va être abonné après la mise à jour
      let willBeSubscribed: boolean;
      
      if (subscriptionIndex === -1 || subscriptionIndex === undefined) {
        // Ajouter un nouveau statut d'abonnement
        const subscriptions = podcast.subscription || [];
        subscriptions.push({
          profileId,
          subscription: true
        });
        podcast.subscription = subscriptions;
        willBeSubscribed = true;
      } else {
        // Inverser le statut d'abonnement existant
        const isCurrentlySubscribed = podcast.subscription[subscriptionIndex].subscription;
        podcast.subscription[subscriptionIndex].subscription = !isCurrentlySubscribed;
        willBeSubscribed = !isCurrentlySubscribed;
      }
      
      // Si le profil s'abonne et qu'il n'y a pas d'épisodes stockés, les récupérer
      if (willBeSubscribed && (!podcast.episodes || podcast.episodes.length === 0)) {
        podcast.episodes = await this.fetchEpisodesFromRss(podcast.url);
      } 
      // Si le profil se désabonne, vérifier s'il reste des abonnés
      else if (!willBeSubscribed) {
        const anySubscribers = podcast.subscription.some(sub => sub.subscription);
        if (!anySubscribers) {
          // Aucun abonné restant, supprimer les épisodes stockés
          podcast.episodes = [];
        }
      }
      
      podcasts[podcastIndex] = podcast;
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut d'abonnement:`, error);
      return false;
    }
  }

  /**
   * Vérifie si un profil est abonné à un podcast
   */
  static async isSubscribed(podcastId: string, profileId: string): Promise<boolean> {
    try {
      const podcast = await this.getPodcastById(podcastId);
      if (!podcast) {
        return false;
      }
      
      return podcast.subscription?.some(
        sub => sub.profileId === profileId && sub.subscription
      ) || false;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'abonnement:`, error);
      return false;
    }
  }

  /**
   * Récupère tous les podcasts auxquels un profil est abonné
   */
  static async getSubscribedPodcasts(profileId: string): Promise<Podcast[]> {
    try {
      const podcasts = await this.getPodcasts();
      return podcasts.filter(podcast => 
        podcast.subscription?.some(sub => sub.profileId === profileId && sub.subscription)
      );
    } catch (error) {
      console.error(`Erreur lors de la récupération des podcasts abonnés:`, error);
      return [];
    }
  }

  /**
   * Met à jour le statut d'un épisode
   */
  static async updateEpisodeStatus(
    podcastId: string,
    episodeId: string,
    status: EpisodeStatus,
    timestamp: number,
    profileId: string
  ): Promise<boolean> {
    try {
      const podcasts = await this.getPodcasts();
      const podcastIndex = podcasts.findIndex(podcast => podcast.id === podcastId);
      
      if (podcastIndex === -1) {
        console.error(`Podcast avec l'ID ${podcastId} non trouvé`);
        return false;
      }
      
      const podcast = podcasts[podcastIndex];
      
      // Vérifier si le profil est abonné au podcast
      const isSubscribed = podcast.subscription?.some(
        sub => sub.profileId === profileId && sub.subscription
      );
      
      // Si le profil n'est pas abonné, on ne peut pas mettre à jour le statut
      if (!isSubscribed) {
        console.error(`Le profil ${profileId} n'est pas abonné au podcast ${podcastId}`);
        return false;
      }
      
      const episodeIndex = podcast.episodes.findIndex(episode => episode.id === episodeId);
      
      if (episodeIndex === -1) {
        console.error(`Épisode avec l'ID ${episodeId} non trouvé`);
        return false;
      }
      
      // Mettre à jour le statut de l'épisode pour ce profil spécifique
      const episodeStatusIndex = podcast.episodes[episodeIndex].status?.findIndex(
        (state: EpisodeState) => state.profileId === profileId
      ) ?? -1;
      
      if (episodeStatusIndex === -1 || episodeStatusIndex === undefined) {
        // Ajouter un nouveau statut pour ce profil
        const statusArray = podcast.episodes[episodeIndex].status || [];
        statusArray.push({
          profileId,
          status,
          timestamp
        });
        podcast.episodes[episodeIndex].status = statusArray;
      } else {
        // Mettre à jour le statut existant
        podcast.episodes[episodeIndex].status[episodeStatusIndex].status = status;
        podcast.episodes[episodeIndex].status[episodeStatusIndex].timestamp = timestamp;
      }
      
      podcasts[podcastIndex] = podcast;
      await AsyncStorage.setItem(PODCASTS_STORAGE_KEY, JSON.stringify(podcasts));
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de l'épisode:`, error);
      return false;
    }
  }

  /**
   * Récupère le statut d'écoute d'un épisode pour un profil spécifique
   */
  static async getEpisodeStatus(
    podcastId: string,
    episodeId: string, 
    profileId: string
  ): Promise<{status: EpisodeStatus, timestamp: number} | null> {
    try {
      const podcast = await this.getPodcastById(podcastId);
      if (!podcast) {
        return null;
      }
      
      const episode = podcast.episodes.find(ep => ep.id === episodeId);
      if (!episode) {
        return null;
      }
      
      const statusEntry = episode.status?.find(state => state.profileId === profileId);
      if (!statusEntry) {
        return {
          status: EpisodeStatus.TO_LISTEN,
          timestamp: 0
        };
      }
      
      return {
        status: statusEntry.status,
        timestamp: statusEntry.timestamp
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du statut de l'épisode:`, error);
      return null;
    }
  }
}
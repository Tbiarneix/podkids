import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist, Episode } from '../types/podcast';

export class PlaylistService {
  private static STORAGE_KEY = 'PLAYLISTS';

  /**
   * Récupère toutes les playlists
   */
  static async getPlaylists(): Promise<Playlist[]> {
    try {
      const playlistsData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (playlistsData) {
        return JSON.parse(playlistsData);
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des playlists:', error);
      return [];
    }
  }

  /**
   * Récupère une playlist par son ID
   */
  static async getPlaylistById(playlistId: string): Promise<Playlist | null> {
    try {
      const playlists = await this.getPlaylists();
      return playlists.find(playlist => playlist.id === playlistId) || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la playlist:', error);
      return null;
    }
  }

  /**
   * Crée une nouvelle playlist
   */
  static async createPlaylist(name: string): Promise<Playlist> {
    try {
      const playlists = await this.getPlaylists();
      
      const newPlaylist: Playlist = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name,
        episodes: [],
        deleteable: true
      };
      
      const updatedPlaylists = [...playlists, newPlaylist];
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPlaylists));
      
      return newPlaylist;
    } catch (error) {
      console.error('Erreur lors de la création de la playlist:', error);
      throw error;
    }
  }

  /**
   * Ajoute un épisode à une playlist
   */
  static async addEpisodeToPlaylist(playlistId: string, episode: Episode): Promise<Playlist | null> {
    try {
      const playlists = await this.getPlaylists();
      const playlistIndex = playlists.findIndex(p => p.id === playlistId);
      
      if (playlistIndex === -1) {
        return null;
      }
      
      // Vérifier si l'épisode existe déjà dans la playlist
      const episodeExists = playlists[playlistIndex].episodes.some(ep => ep.id === episode.id);
      
      if (!episodeExists) {
        // Ajouter l'épisode à la playlist
        playlists[playlistIndex].episodes.push(episode);
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(playlists));
      }
      
      return playlists[playlistIndex];
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'épisode à la playlist:', error);
      return null;
    }
  }

  /**
   * Supprime un épisode d'une playlist
   */
  static async removeEpisodeFromPlaylist(playlistId: string, episodeId: string): Promise<Playlist | null> {
    try {
      const playlists = await this.getPlaylists();
      const playlistIndex = playlists.findIndex(p => p.id === playlistId);
      
      if (playlistIndex === -1) {
        return null;
      }
      
      // Filtrer les épisodes pour supprimer celui avec l'ID spécifié
      playlists[playlistIndex].episodes = playlists[playlistIndex].episodes.filter(
        ep => ep.id !== episodeId
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(playlists));
      return playlists[playlistIndex];
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'épisode de la playlist:', error);
      return null;
    }
  }

  /**
   * Supprime une playlist
   */
  static async deletePlaylist(playlistId: string): Promise<boolean> {
    try {
      const playlists = await this.getPlaylists();
      const updatedPlaylists = playlists.filter(
        playlist => playlist.id !== playlistId || !playlist.deleteable
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedPlaylists));
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la playlist:', error);
      return false;
    }
  }

  /**
   * Sauvegarde les playlists
   */
  static async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(playlists));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des playlists:', error);
      throw error;
    }
  }
}

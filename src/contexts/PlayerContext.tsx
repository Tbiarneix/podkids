import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Episode, Podcast, EpisodeStatus } from '../types/podcast';
import { PodcastService } from '../services/PodcastService';

type PlayerContextType = {
  currentEpisode: Episode | null;
  currentPodcast: Podcast | null;
  isPlayerVisible: boolean;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  playEpisode: (episode: Episode, podcast: Podcast) => void;
  pauseEpisode: () => void;
  resumeEpisode: () => void;
  closePlayer: () => void;
  seekTo: (position: number) => void;
  togglePlayPause: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

type PlayerProviderProps = {
  children: ReactNode;
};

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Nettoyer le lecteur audio lors du démontage du composant
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Configurer l'audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Erreur lors de la configuration audio:', error);
      }
    };

    setupAudio();
  }, []);

  // Fonction pour mettre à jour le statut de l'épisode
  const updateEpisodeStatus = async (timestamp: number) => {
    if (!currentEpisode || !currentPodcast) return;

    try {
      await PodcastService.updateEpisodeStatus(
        currentPodcast.id,
        currentEpisode.id,
        EpisodeStatus.LISTENING,
        timestamp
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  // Fonction pour marquer l'épisode comme terminé
  const handleEpisodeComplete = async () => {
    if (!currentEpisode || !currentPodcast) return;

    try {
      await PodcastService.updateEpisodeStatus(
        currentPodcast.id,
        currentEpisode.id,
        EpisodeStatus.LISTENED,
        currentEpisode.duration
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  // Fonction pour démarrer l'intervalle de mise à jour
  const startUpdateInterval = () => {
    // Nettoyer l'intervalle précédent s'il existe
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Créer un nouvel intervalle avec une fréquence plus élevée pour une mise à jour plus fluide
    updateIntervalRef.current = setInterval(async () => {
      if (!soundRef.current || !currentEpisode) return;

      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          // Mettre à jour la progression
          const position = status.positionMillis / 1000;
          const duration = currentEpisode.duration;
          setCurrentTime(position);
          setProgress(position / duration);

          // Mettre à jour le timestamp dans le stockage toutes les 5 secondes
          if (Math.floor(position) % 5 === 0) {
            updateEpisodeStatus(position);
          }

          // Vérifier si l'épisode est terminé
          if (position >= duration - 1) {
            handleEpisodeComplete();
            pauseEpisode();
          }
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
    }, 500); // Mise à jour toutes les 500ms au lieu de 1000ms pour une animation plus fluide
  };

  // Fonction pour charger et lire un épisode
  const loadAndPlayEpisode = async (episode: Episode) => {
    try {
      // Décharger l'audio précédent s'il existe
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Mettre à jour la durée
      setDuration(episode.duration);
      
      // Charger le nouvel audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: episode.url },
        { shouldPlay: true, positionMillis: (episode.timestamp || 0) * 1000 }
      );
      
      soundRef.current = sound;
      
      // Configurer les événements de mise à jour du statut
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          // Mettre à jour la progression en temps réel
          if (status.positionMillis !== undefined) {
            const position = status.positionMillis / 1000;
            const duration = episode.duration;
            setCurrentTime(position);
            setProgress(position / duration);
          }
          
          if (status.didJustFinish) {
            handleEpisodeComplete();
            pauseEpisode();
          }
        }
      });
      
      setIsPlaying(true);
      startUpdateInterval();
    } catch (error) {
      console.error('Erreur lors du chargement de l\'audio:', error);
      setIsPlaying(false);
    }
  };

  const playEpisode = (episode: Episode, podcast: Podcast) => {
    setCurrentEpisode(episode);
    setCurrentPodcast(podcast);
    setIsPlayerVisible(true);
    setCurrentTime(episode.timestamp || 0);
    setProgress((episode.timestamp || 0) / episode.duration);
    setDuration(episode.duration);
    
    loadAndPlayEpisode(episode);
  };

  const pauseEpisode = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      
      // Arrêter l'intervalle de mise à jour
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      
      // Mettre à jour le timestamp
      if (currentEpisode && currentPodcast) {
        updateEpisodeStatus(currentTime);
      }
    }
  };

  const resumeEpisode = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      startUpdateInterval();
    }
  };

  const closePlayer = async () => {
    // Mettre en pause et sauvegarder la position
    await pauseEpisode();
    setIsPlayerVisible(false);
  };

  const seekTo = async (position: number) => {
    if (soundRef.current && currentEpisode) {
      await soundRef.current.setPositionAsync(position * 1000);
      setCurrentTime(position);
      setProgress(position / currentEpisode.duration);
      updateEpisodeStatus(position);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseEpisode();
    } else {
      resumeEpisode();
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentEpisode,
        currentPodcast,
        isPlayerVisible,
        isPlaying,
        progress,
        currentTime,
        duration,
        playEpisode,
        pauseEpisode,
        resumeEpisode,
        closePlayer,
        seekTo,
        togglePlayPause,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Episode, Podcast } from '../types/podcast';

type PlayerContextType = {
  currentEpisode: Episode | null;
  currentPodcast: Podcast | null;
  isPlayerVisible: boolean;
  playEpisode: (episode: Episode, podcast: Podcast) => void;
  closePlayer: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

type PlayerProviderProps = {
  children: ReactNode;
};

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  const playEpisode = (episode: Episode, podcast: Podcast) => {
    setCurrentEpisode(episode);
    setCurrentPodcast(podcast);
    setIsPlayerVisible(true);
  };

  const closePlayer = () => {
    setIsPlayerVisible(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentEpisode,
        currentPodcast,
        isPlayerVisible,
        playEpisode,
        closePlayer,
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

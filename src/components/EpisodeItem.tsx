import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { COLORS, SPACING, SIZES } from '../utils/theme';
import { Episode, Podcast, EpisodeStatus } from '../types/podcast';

interface EpisodeItemProps {
  episode: Episode;
  podcast?: Podcast;
  onPress: (episode: Episode) => void;
  onPlayPress: (episode: Episode) => void;
  showOnlyUnlistened?: boolean;
}

export const EpisodeItem: React.FC<EpisodeItemProps> = ({
  episode,
  podcast,
  onPress,
  onPlayPress,
  showOnlyUnlistened = false
}) => {
  // Si on filtre pour n'afficher que les épisodes non écoutés et que cet épisode est écouté, on le cache
  if (showOnlyUnlistened && episode.status === EpisodeStatus.LISTENED) {
    return null;
  }

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getEpisodeTimeDisplay = (episode: Episode): string => {
    if (episode.status === EpisodeStatus.TO_LISTEN) {
      return formatDuration(episode.duration);
    } else if (episode.status === EpisodeStatus.LISTENING) {
      const remaining = episode.duration - episode.timestamp;
      return `${formatDuration(remaining)} restantes`;
    } else {
      return formatDuration(episode.duration);
    }
  };

  const getEpisodeStatusText = (status: EpisodeStatus): string => {
    switch (status) {
      case EpisodeStatus.TO_LISTEN:
        return 'Pas encore écouté';
      case EpisodeStatus.LISTENING:
        return 'En cours';
      case EpisodeStatus.LISTENED:
        return 'Terminé';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.episodeItem}
      onPress={() => onPress(episode)}
    >
      <Image 
        source={{ uri: episode.cover || (podcast?.cover || 'https://via.placeholder.com/150') }}
        style={styles.episodeCover}
      />
      <View style={styles.episodeInfo}>
        <Typography variant="subtitle" numberOfLines={2} style={styles.episodeName}>
          {episode.name}
        </Typography>
        <Typography variant="caption" numberOfLines={1} style={styles.episodeDescription}>
          {episode.description.length > 100 
            ? `${episode.description.substring(0, 100)}...` 
            : episode.description}
        </Typography>
        <View style={styles.tagsContainer}>
          <View style={styles.statusTag}>
            <Typography variant="caption" style={styles.tagText}>
              {getEpisodeStatusText(episode.status)}
            </Typography>
          </View>
          
          <View style={styles.durationTag}>
            <Typography variant="caption" style={styles.tagText}>
              {getEpisodeTimeDisplay(episode)}
            </Typography>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={() => onPlayPress(episode)}
      >
        <Ionicons 
          name={episode.status === EpisodeStatus.LISTENING ? "pause-circle" : "play-circle"} 
          size={40} 
          color={COLORS.primary} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  episodeItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    position: 'relative',
  },
  episodeCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  episodeInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  episodeName: {
    fontWeight: 'bold',
  },
  episodeDescription: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
  playButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTag: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: SPACING.sm,
  },
  durationTag: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 12,
  },
});

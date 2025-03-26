import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { COLORS, SPACING } from '../utils/theme';
import { Episode, Podcast, EpisodeStatus } from '../types/podcast';
import { RootStackParamList } from '../types/navigation';
import { usePlayer } from '../contexts/PlayerContext';

type EpisodeItemProps = {
  episode: Episode;
  podcast: Podcast;
};

export const EpisodeItem: React.FC<EpisodeItemProps> = ({ 
  episode, 
  podcast
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { 
    playEpisode, 
    togglePlayPause, 
    isPlaying, 
    currentEpisode 
  } = usePlayer();

  // Vérifier si cet épisode est celui qui est en cours de lecture
  const isCurrentEpisode = currentEpisode?.id === episode.id;

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    
    return `${minutes} min`;
  };

  const formatRemainingTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours} h ${minutes} min ${secs} sec restantes`;
    }
    
    return `${minutes} min ${secs} sec restantes`;
  };

  const getStatusLabel = (status: EpisodeStatus): string => {
    switch (status) {
      case EpisodeStatus.TO_LISTEN:
        return 'À écouter';
      case EpisodeStatus.LISTENING:
        return 'En cours';
      case EpisodeStatus.LISTENED:
        return 'Écouté';
      default:
        return '';
    }
  };

  const handlePress = () => {
    navigation.navigate('EpisodeDetails', {
      podcastId: podcast.id,
      episodeId: episode.id
    });
  };

  const handlePlayPress = () => {
    if (isCurrentEpisode) {
      // Si c'est l'épisode en cours, on bascule entre play et pause
      togglePlayPause();
    } else {
      // Sinon on lance la lecture de cet épisode
      playEpisode(episode, podcast);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <Image 
        source={{ uri: episode.cover || podcast.cover || 'https://via.placeholder.com/60' }}
        style={styles.cover}
      />
      
      <View style={styles.content}>
        <Typography variant="body" style={styles.title} numberOfLines={1}>
          {episode.name}
        </Typography>
        
        <Typography variant="caption" style={styles.description} numberOfLines={2}>
          {episode.description}
        </Typography>
        
        <View style={styles.footer}>
          <View style={styles.tagsContainer}>
            <View style={[
              styles.tag, 
              episode.status === EpisodeStatus.LISTENING ? styles.listeningTag : 
              episode.status === EpisodeStatus.LISTENED ? styles.listenedTag : 
              styles.toListenTag
            ]}>
              <Typography variant="caption" style={styles.tagText}>
                {getStatusLabel(episode.status)}
              </Typography>
            </View>
            
            {episode.status !== EpisodeStatus.LISTENED && (
              <View style={styles.durationTag}>
                <Typography variant="caption" style={styles.tagText}>
                  {episode.status === EpisodeStatus.LISTENING && episode.timestamp !== undefined
                    ? formatRemainingTime(episode.duration - episode.timestamp)
                    : formatDuration(episode.duration)}
                </Typography>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.playButton}
        onPress={handlePlayPress}
      >
        <Ionicons 
          name={(isCurrentEpisode && isPlaying) ? "pause-circle" : "play-circle"} 
          size={44} 
          color={COLORS.primary} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  toListenTag: {
    backgroundColor: COLORS.tertiary + '40',
  },
  listeningTag: {
    backgroundColor: COLORS.primary + '40',
  },
  listenedTag: {
    backgroundColor: COLORS.success + '40',
  },
  durationTag: {
    backgroundColor: COLORS.textTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.text,
  },
  playButton: {
    marginLeft: SPACING.sm,
  },
});

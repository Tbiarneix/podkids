import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { COLORS, SPACING } from '../utils/theme';
import { Episode, Podcast, EpisodeStatus } from '../types/podcast';
import { RootStackParamList } from '../types/navigation';
import { PodcastService } from '../services/PodcastService';

type PlayerBarProps = {
  episode: Episode;
  podcast: Podcast;
  onClose: () => void;
};

export const PlayerBar: React.FC<PlayerBarProps> = ({ 
  episode, 
  podcast, 
  onClose 
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(episode.timestamp || 0);
  const [animatedHeight] = useState(new Animated.Value(0));

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Animer l'apparition du lecteur
    Animated.timing(animatedHeight, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false
    }).start();

    // Simuler la progression de la lecture
    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 1;
          if (newTime >= episode.duration) {
            clearInterval(interval);
            handleEpisodeComplete();
            return episode.duration;
          }
          
          // Mettre à jour la progression
          setProgress(newTime / episode.duration);
          
          // Mettre à jour le timestamp dans le stockage toutes les 5 secondes
          if (newTime % 5 === 0) {
            updateEpisodeTimestamp(newTime);
          }
          
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, episode]);

  const updateEpisodeTimestamp = async (timestamp: number) => {
    try {
      await PodcastService.updateEpisodeStatus(
        podcast.id,
        episode.id,
        EpisodeStatus.LISTENING,
        timestamp
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du timestamp:', error);
    }
  };

  const handleEpisodeComplete = async () => {
    try {
      await PodcastService.updateEpisodeStatus(
        podcast.id,
        episode.id,
        EpisodeStatus.LISTENED,
        episode.duration
      );
      setIsPlaying(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleOpenEpisodeDetails = () => {
    navigation.navigate('EpisodeDetails', {
      podcastId: podcast.id,
      episodeId: episode.id
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const getRemainingTime = (): string => {
    const remaining = episode.duration - currentTime;
    return formatTime(remaining);
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { height: animatedHeight.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 70]
        })}
      ]}
    >
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${progress * 100}%` }
          ]} 
        />
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.episodeInfo}
          onPress={handleOpenEpisodeDetails}
        >
          <Image 
            source={{ uri: episode.cover || podcast.cover || 'https://via.placeholder.com/40' }}
            style={styles.cover}
          />
          <View style={styles.textContainer}>
            <Typography variant="caption" numberOfLines={1} style={styles.episodeName}>
              {episode.name}
            </Typography>
            <Typography variant="caption" numberOfLines={1} style={styles.remainingTime}>
              {getRemainingTime()} restantes
            </Typography>
          </View>
        </TouchableOpacity>
        
        <View style={styles.controls}>
          <TouchableOpacity onPress={togglePlayPause} style={styles.playButton}>
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={28} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.textTertiary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.textSecondary,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  episodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  textContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  episodeName: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  remainingTime: {
    color: COLORS.tertiary,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    marginRight: SPACING.md,
  },
  closeButton: {
    padding: 4,
  },
});

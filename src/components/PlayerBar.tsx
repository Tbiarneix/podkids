import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { COLORS, SPACING } from '../utils/theme';
import { formatTime } from '../utils/timeUtils';
import { Episode, Podcast } from '../types/podcast';
import { RootStackParamList } from '../types/navigation';
import { usePlayer } from '../contexts/PlayerContext';

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
  const { isPlaying, progress, currentTime, pauseEpisode, resumeEpisode, seekTo } = usePlayer();
  const [animatedHeight] = React.useState(new Animated.Value(0));
  const [remainingTimeText, setRemainingTimeText] = React.useState('');
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // Animer l'apparition du lecteur
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, []);

  // Mettre à jour la progression et le temps restant en temps réel
  useEffect(() => {
    if (!isSeeking && episode?.duration) {
      // Calculer le temps restant précisément
      const remaining = Math.max(0, episode.duration - currentTime);
      setRemainingTimeText(`${formatTime(remaining)} restantes`);
      setSeekPosition(episode.duration > 0 ? currentTime / episode.duration : 0);
    }
  }, [progress, currentTime, episode.duration, isSeeking]);

  const handleOpenEpisodeDetails = () => {
    navigation.navigate('EpisodeDetails', {
      podcastId: podcast.id,
      episodeId: episode.id
    });
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseEpisode();
    } else {
      resumeEpisode();
    }
  };

  // Gestion du glissement sur la barre de progression
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsSeeking(true);
    },
    onPanResponderMove: (_, gestureState) => {
      const { moveX } = gestureState;
      const progressBarWidth = Dimensions.get('window').width;
      let position = moveX / progressBarWidth;
      
      // Limiter la position entre 0 et 1
      position = Math.max(0, Math.min(1, position));
      
      setSeekPosition(position);
      
      // Calculer le temps restant précisément pendant le seeking
      if (episode?.duration) {
        const remainingTime = episode.duration * (1 - position);
        setRemainingTimeText(`${formatTime(remainingTime)} restantes`);
      }
    },
    onPanResponderRelease: () => {
      if (episode?.duration) {
        const newPosition = seekPosition * episode.duration;
        seekTo(newPosition);
      }
      setIsSeeking(false);
    },
  });

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
      <View 
        style={styles.progressBar}
        {...panResponder.panHandlers}
      >
        <View 
          style={[
            styles.progressFill, 
            { width: `${(isSeeking ? seekPosition : progress) * 100}%` }
          ]} 
        />
        <View 
          style={[
            styles.progressHandle, 
            { left: `${(isSeeking ? seekPosition : progress) * 100}%` }
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
              {remainingTimeText}
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
    height: 6,
    backgroundColor: COLORS.textSecondary,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressHandle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: -3,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  textContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  episodeName: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  remainingTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    marginRight: SPACING.sm,
  },
  closeButton: {
    padding: 4,
  },
});

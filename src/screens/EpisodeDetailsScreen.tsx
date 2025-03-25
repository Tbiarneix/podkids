import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Typography } from '../components/Typography';
import { COLORS, SPACING, SIZES } from '../utils/theme';
import { PodcastService } from '../services/PodcastService';
import { usePlayer } from '../contexts/PlayerContext';
import { RootStackParamList } from '../types/navigation';
import { Podcast, Episode, EpisodeStatus } from '../types/podcast';
import { formatTime } from '../utils/timeUtils';

type EpisodeDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EpisodeDetails'
>;

type EpisodeDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'EpisodeDetails'
>;

export const EpisodeDetailsScreen: React.FC = () => {
  const navigation = useNavigation<EpisodeDetailsScreenNavigationProp>();
  const route = useRoute<EpisodeDetailsScreenRouteProp>();
  const { podcastId, episodeId } = route.params;
  const { 
    playEpisode, 
    pauseEpisode, 
    resumeEpisode, 
    seekTo, 
    isPlaying, 
    currentTime, 
    progress,
    currentEpisode,
    currentPodcast,
    togglePlayPause
  } = usePlayer();

  const [loading, setLoading] = useState(true);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [currentTimeText, setCurrentTimeText] = useState('0:00');

  const screenWidth = Dimensions.get('window').width;
  
  // Vérifier si l'épisode actuel est celui qui est en cours de lecture
  const isCurrentEpisode = currentEpisode?.id === episodeId;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const podcastData = await PodcastService.getPodcastById(podcastId);
        
        if (podcastData) {
          setPodcast(podcastData);
          const episodeData = podcastData.episodes.find(ep => ep.id === episodeId);
          
          if (episodeData) {
            setEpisode(episodeData);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'épisode:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [podcastId, episodeId]);

  // Mettre à jour le slider lorsque la progression change
  useEffect(() => {
    if (isCurrentEpisode && episode && !isSeeking) {
      setSliderValue(progress);
    }
  }, [isCurrentEpisode, progress, episode, isSeeking]);

  // Vérifier que la durée de l'épisode est valide
  useEffect(() => {
    if (episode && episode.duration <= 0) {
      console.warn('Durée de l\'épisode invalide:', episode.duration);
      
      // Si l'épisode est en cours de lecture, utiliser la durée du contexte si disponible
      if (isCurrentEpisode && currentEpisode && currentEpisode.duration > 0) {
        const updatedEpisode = { ...episode, duration: currentEpisode.duration };
        setEpisode(updatedEpisode);
      }
    }
  }, [episode, isCurrentEpisode, currentEpisode]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTogglePlayPause = () => {
    if (!episode || !podcast) return;
    
    if (isCurrentEpisode) {
      // Si c'est l'épisode en cours de lecture, on utilise le toggle du contexte
      togglePlayPause();
    } else {
      // Sinon, on lance la lecture de cet épisode
      playEpisode(episode, podcast);
    }
  };

  const handleSliderChange = (value: number) => {
    if (!episode) return;
    
    setIsSeeking(true);
    setSliderValue(value);
  };

  const handleSliderComplete = async (value: number) => {
    if (!episode) return;
    
    const newTime = Math.floor(value * episode.duration);
    
    if (isCurrentEpisode) {
      // Si c'est l'épisode en cours de lecture, on utilise seekTo du contexte
      seekTo(newTime);
    } else {
      // Sinon, on met juste à jour le statut
      await PodcastService.updateEpisodeStatus(
        podcast!.id,
        episode.id,
        episode.status,
        newTime
      );
    }
    
    setIsSeeking(false);
  };

  const updateEpisodeStatus = async (status: EpisodeStatus) => {
    if (!episode || !podcast) return;
    
    try {
      // Utiliser la méthode updateEpisodeStatus du PodcastService
      await PodcastService.updateEpisodeStatus(
        podcast.id,
        episode.id,
        status,
        isCurrentEpisode ? currentTime : episode.timestamp || 0
      );
      
      // Mettre à jour l'état local
      const updatedEpisode = {
        ...episode,
        status
      };
      setEpisode(updatedEpisode);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'épisode:', error);
    }
  };

  const markAsListened = async () => {
    if (!episode) return;
    
    if (isCurrentEpisode) {
      pauseEpisode();
    }
    
    await PodcastService.updateEpisodeStatus(
      podcast!.id,
      episode.id,
      EpisodeStatus.LISTENED,
      episode.duration
    );
    
    // Mettre à jour l'état local
    const updatedEpisode = {
      ...episode,
      status: EpisodeStatus.LISTENED,
      timestamp: episode.duration
    };
    
    setEpisode(updatedEpisode);
    setSliderValue(1);
  };

  const markAsUnlistened = async () => {
    if (!episode) return;
    
    if (isCurrentEpisode) {
      pauseEpisode();
    }
    
    await PodcastService.updateEpisodeStatus(
      podcast!.id,
      episode.id,
      EpisodeStatus.TO_LISTEN,
      0
    );
    
    // Mettre à jour l'état local
    const updatedEpisode = {
      ...episode,
      status: EpisodeStatus.TO_LISTEN,
      timestamp: 0
    };
    
    setEpisode(updatedEpisode);
    setSliderValue(0);
  };

  if (loading || !episode || !podcast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography variant="body" style={styles.loadingText}>
            Chargement de l'épisode...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center style={styles.headerTitle} numberOfLines={1}>
          {podcast.name}
        </Typography>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image 
          source={{ uri: episode.cover || podcast.cover || 'https://via.placeholder.com/300' }}
          style={[styles.episodeCover, { width: screenWidth - 2 * SPACING.xl }]}
        />

        <View style={styles.episodeInfo}>
          <Typography variant="subtitle" style={styles.episodeName}>
            {episode.name}
          </Typography>
          
          <View style={styles.tagsContainer}>
            <View style={styles.statusTag}>
              <Typography variant="caption" style={styles.tagText}>
                {episode.status === EpisodeStatus.TO_LISTEN ? 'Pas encore écouté' : 
                 episode.status === EpisodeStatus.LISTENING ? 'En cours' : 'Terminé'}
              </Typography>
            </View>
            
            <View style={styles.durationTag}>
              <Typography variant="caption" style={styles.tagText}>
                {formatTime(episode.duration)}
              </Typography>
            </View>
          </View>
          
          <Typography variant="body" style={styles.episodeDescription}>
            {episode.description}
          </Typography>
        </View>

        <View style={styles.playerContainer}>
          <View style={styles.sliderContainer}>
            <Typography variant="caption" style={styles.timeText}>
              {isCurrentEpisode ? formatTime(currentTime) : formatTime(episode.timestamp || 0)}
            </Typography>
            
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={sliderValue}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.textSecondary}
              thumbTintColor={COLORS.primary}
              onValueChange={handleSliderChange}
              onSlidingComplete={handleSliderComplete}
              disabled={!episode || episode.duration <= 0}
            />
            
            <Typography variant="caption" style={styles.timeText}>
              {episode && episode.duration > 0 
                ? formatTime(episode.duration) 
                : formatTime(0)}
            </Typography>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (isCurrentEpisode) {
                  seekTo(Math.max(0, currentTime - 10));
                }
              }}
            >
              <Ionicons name="play-back" size={24} color={COLORS.text} />
              <Typography variant="caption" style={styles.controlText}>10s</Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playPauseButton}
              onPress={handleTogglePlayPause}
            >
              <Ionicons 
                name={(isCurrentEpisode && isPlaying) ? "pause-circle" : "play-circle"} 
                size={60} 
                color={COLORS.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (isCurrentEpisode) {
                  seekTo(Math.min(episode.duration, currentTime + 10));
                }
              }}
            >
              <Ionicons name="play-forward" size={24} color={COLORS.text} />
              <Typography variant="caption" style={styles.controlText}>10s</Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.listenedButton]}
              onPress={markAsListened}
            >
              <Typography variant="caption" style={[styles.actionButtonText, styles.listenedButtonText]}>
                Marquer comme écouté
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.unlistenedButton]}
              onPress={markAsUnlistened}
            >
              <Typography variant="caption" style={styles.actionButtonText}>
                Marquer comme non écouté
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xxxl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: SPACING.sm,
  },
  placeholder: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  content: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  episodeCover: {
    height: 300,
    borderRadius: 12,
    marginBottom: SPACING.xl,
  },
  episodeInfo: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  episodeName: {
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
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
  episodeDescription: {
    color: COLORS.text,
    lineHeight: 22,
  },
  playerContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.md,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    color: COLORS.text,
    width: 40,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  controlButton: {
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
  },
  controlText: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  playPauseButton: {
    marginHorizontal: SPACING.xl,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  listenedButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unlistenedButton: {
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.text,
  },
  listenedButtonText: {
    color: COLORS.textTertiary,
  },
});

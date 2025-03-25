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
  const { playEpisode } = usePlayer();

  const [loading, setLoading] = useState(true);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  const screenWidth = Dimensions.get('window').width;

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
            setCurrentTime(episodeData.timestamp || 0);
            setSliderValue(episodeData.timestamp ? episodeData.timestamp / episodeData.duration : 0);
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

  const handleBack = () => {
    navigation.goBack();
  };

  const togglePlayPause = async () => {
    if (!episode || !podcast) return;

    setIsPlaying(!isPlaying);
    
    // Mettre à jour le statut de l'épisode
    if (!isPlaying) {
      // Si on commence à jouer
      if (episode.status === EpisodeStatus.TO_LISTEN) {
        await updateEpisodeStatus(EpisodeStatus.LISTENING);
      }
      
      // Lancer la lecture dans le lecteur global
      playEpisode(episode, podcast);
    }
  };

  const updateEpisodeStatus = async (status: EpisodeStatus) => {
    if (!episode || !podcast) return;
    
    try {
      // Utiliser la méthode updateEpisodeStatus du PodcastService
      await PodcastService.updateEpisodeStatus(
        podcast.id,
        episode.id,
        status,
        currentTime
      );
      
      // Mettre à jour l'état local
      const updatedEpisode = {
        ...episode,
        status,
        timestamp: currentTime
      };
      
      const updatedEpisodes = podcast.episodes.map(ep => 
        ep.id === episode.id ? updatedEpisode : ep
      );
      
      setEpisode(updatedEpisode);
      setPodcast({
        ...podcast,
        episodes: updatedEpisodes
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'épisode:', error);
    }
  };

  const handleSliderChange = (value: number) => {
    if (!episode) return;
    
    setSliderValue(value);
    const newTime = Math.floor(value * episode.duration);
    setCurrentTime(newTime);
  };

  const handleSliderComplete = async (value: number) => {
    if (!episode) return;
    
    const newTime = Math.floor(value * episode.duration);
    setCurrentTime(newTime);
    
    // Mettre à jour le timestamp de l'épisode
    await updateEpisodeStatus(episode.status);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const markAsListened = async () => {
    if (!episode) return;
    
    setIsPlaying(false);
    setCurrentTime(episode.duration);
    setSliderValue(1);
    await updateEpisodeStatus(EpisodeStatus.LISTENED);
  };

  const markAsUnlistened = async () => {
    if (!episode) return;
    
    setIsPlaying(false);
    setCurrentTime(0);
    setSliderValue(0);
    await updateEpisodeStatus(EpisodeStatus.TO_LISTEN);
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
              {formatTime(currentTime)}
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
            />
            
            <Typography variant="caption" style={styles.timeText}>
              {formatTime(episode.duration)}
            </Typography>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => setCurrentTime(Math.max(0, currentTime - 10))}
            >
              <Ionicons name="play-back" size={24} color={COLORS.text} />
              <Typography variant="caption" style={styles.controlText}>10s</Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playPauseButton}
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={isPlaying ? "pause-circle" : "play-circle"} 
                size={60} 
                color={COLORS.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => setCurrentTime(Math.min(episode.duration, currentTime + 10))}
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
    marginBottom: SPACING.lg,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    color: COLORS.textSecondary,
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

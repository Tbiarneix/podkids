import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { EpisodeItem } from '../components/EpisodeItem';
import { COLORS, SPACING, SIZES } from '../utils/theme';
import { PodcastService } from '../services/PodcastService';
import { usePlayer } from '../contexts/PlayerContext';
import { RootStackParamList } from '../types/navigation';
import { Podcast, Episode, EpisodeStatus } from '../types/podcast';

type PodcastDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PodcastDetails'
>;

type PodcastDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'PodcastDetails'
>;

export const PodcastDetailsScreen: React.FC = () => {
  const navigation = useNavigation<PodcastDetailsScreenNavigationProp>();
  const route = useRoute<PodcastDetailsScreenRouteProp>();
  const { podcastId } = route.params;
  const { playEpisode } = usePlayer();

  const [loading, setLoading] = useState(true);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [sortOldestFirst, setSortOldestFirst] = useState(false);
  const [showOnlyUnlistened, setShowOnlyUnlistened] = useState(false);

  useEffect(() => {
    const loadPodcast = async () => {
      try {
        setLoading(true);
        const podcastData = await PodcastService.getPodcastById(podcastId);
        if (podcastData) {
          setPodcast(podcastData);
          
          // Trier les épisodes par date de publication (plus récent d'abord par défaut)
          const sortedEpisodes = [...podcastData.episodes].sort((a, b) => 
            sortOldestFirst 
              ? a.publicationDate - b.publicationDate 
              : b.publicationDate - a.publicationDate
          );
          
          setEpisodes(sortedEpisodes);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du podcast:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPodcast();
  }, [podcastId, sortOldestFirst]);

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleSortOrder = () => {
    setSortOldestFirst(!sortOldestFirst);
  };

  const toggleShowUnlistened = () => {
    setShowOnlyUnlistened(!showOnlyUnlistened);
  };

  const handleEpisodePress = (episode: Episode) => {
    navigation.navigate('EpisodeDetails', { 
      podcastId: podcastId,
      episodeId: episode.id
    });
  };

  const handlePlayButtonPress = (episode: Episode) => {
    if (!podcast) return;
    
    // Mettre à jour le statut de l'épisode si nécessaire
    if (episode.status === EpisodeStatus.TO_LISTEN) {
      PodcastService.updateEpisodeStatus(
        podcast.id,
        episode.id,
        EpisodeStatus.LISTENING,
        0
      );
    }
    
    // Lancer la lecture de l'épisode
    playEpisode(episode, podcast);
  };

  const handleToggleSubscription = async () => {
    if (!podcast) return;
    
    try {
      const updatedPodcast = await PodcastService.updatePodcast(
        podcast.id,
        { subscription: !podcast.subscription }
      );
      
      if (updatedPodcast) {
        setPodcast(updatedPodcast);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    }
  };

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

  const renderEpisodeItem = ({ item }: { item: Episode }) => {
    if (!podcast) return null;
    
    return (
      <EpisodeItem
        episode={item}
        podcast={podcast}
      />
    );
  };

  if (loading || !podcast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography variant="body" style={styles.loadingText}>
            Chargement du podcast...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  const filteredEpisodes = showOnlyUnlistened 
    ? episodes.filter(ep => ep.status !== EpisodeStatus.LISTENED) 
    : episodes;

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

      <View style={styles.podcastHeader}>
        <Image 
          source={{ uri: podcast.cover || 'https://via.placeholder.com/150' }}
          style={styles.podcastCover}
        />
        <View style={styles.podcastInfo}>
          <Typography variant="subtitle" style={styles.podcastName}>
            {podcast.name}
          </Typography>
          <Typography variant="caption" style={styles.podcastAuthor}>
            {podcast.author || 'Auteur inconnu'}
          </Typography>
          <Typography variant="caption" style={styles.episodeCount}>
            {podcast.episodes.length} épisodes
          </Typography>
          <TouchableOpacity 
            style={[
              styles.subscriptionButton, 
              podcast.subscription ? styles.subscribedButton : {}
            ]}
            onPress={handleToggleSubscription}
          >
            <Typography 
              variant="caption" 
              style={[
                styles.buttonText, 
                podcast.subscription ? styles.subscribedButtonText : {}
              ]}
            >
              {podcast.subscription ? 'Abonné' : 'S\'abonner'}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, sortOldestFirst && styles.activeFilterButton]} 
          onPress={toggleSortOrder}
        >
          <Typography 
            variant="caption" 
            style={[styles.filterButtonText, sortOldestFirst && styles.activeFilterButtonText]}
          >
            {sortOldestFirst ? 'Plus ancien' : 'Plus récent'}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterButton, showOnlyUnlistened && styles.activeFilterButton]} 
          onPress={toggleShowUnlistened}
        >
          <Typography 
            variant="caption" 
            style={[styles.filterButtonText, showOnlyUnlistened && styles.activeFilterButtonText]}
          >
            {showOnlyUnlistened ? 'Non écoutés' : 'Tous les épisodes'}
          </Typography>
        </TouchableOpacity>
      </View>

      {filteredEpisodes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="body" center>
            Aucun épisode disponible.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredEpisodes}
          renderItem={renderEpisodeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  podcastHeader: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  podcastCover: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  podcastInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  podcastName: {
    fontWeight: 'bold',
  },
  podcastAuthor: {
    color: COLORS.textSecondary,
  },
  episodeCount: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  subscriptionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  subscribedButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: SIZES.xs,
  },
  subscribedButtonText: {
    color: COLORS.textTertiary,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: COLORS.tertiary,
    borderColor: COLORS.tertiary,
  },
  filterButtonText: {
    color: COLORS.text,
    fontSize: SIZES.xs,
  },
  activeFilterButtonText: {
    color: COLORS.textTertiary,
  },
  listContent: {
    padding: SPACING.md,
  },
});

import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { Avatar } from '../components/Avatar';
import { COLORS, SPACING } from '../utils/theme';
import { RootStackParamList } from '../types/navigation';
import { PodcastService } from '../services/PodcastService';
import { Episode, EpisodeStatus, PodcastType, PodcastTypeDescription, EpisodeState } from '../types/podcast';
import { useActiveProfile } from '../contexts/ActiveProfileContext';

type HomeProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HomeProfile'
>;

interface ContinueListeningEpisode extends Episode {
  podcastName: string;
  podcastId: string;
  timestamp: number;
}

export const HomeProfileScreen: React.FC = () => {
  const navigation = useNavigation<HomeProfileScreenNavigationProp>();
  const { activeProfile } = useActiveProfile();

  const [listeningEpisodes, setListeningEpisodes] = useState<ContinueListeningEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [podcastTypeWithContent, setPodcastTypeWithContent] = useState<PodcastType[]>([]);
  
  // Créer un tableau des types de podcasts pour la section "Découvrir"
  const podcastTypeEntries = Object.entries(PodcastType).map(([key, value]) => ({
    key,
    type: value,
    description: PodcastTypeDescription[key as keyof typeof PodcastTypeDescription]
  }));

  useEffect(() => {
    const loadListeningEpisodes = async () => {
      if (!activeProfile) return;
      
      try {
        setLoading(true);
        
        // Récupérer tous les podcasts
        const podcasts = await PodcastService.getPodcasts();
        
        // Récupérer tous les épisodes en cours d'écoute pour le profil actif
        const listeningEps: ContinueListeningEpisode[] = [];
        
        podcasts.forEach(podcast => {
          const podcastListeningEpisodes = podcast.episodes
            .filter(episode => {
              // Trouver l'état de l'épisode pour le profil actif
              const episodeState = episode.status?.find(
                (state: EpisodeState) => state.profileId === activeProfile.id
              );
              // Vérifier si l'épisode est en cours d'écoute pour ce profil
              return episodeState?.status === EpisodeStatus.LISTENING;
            })
            .map(episode => {
              // Récupérer le timestamp pour le profil actif
              const episodeState = episode.status?.find(
                (state: EpisodeState) => state.profileId === activeProfile.id
              );
              
              return {
                ...episode,
                podcastName: podcast.name,
                podcastId: podcast.id,
                // Utiliser le timestamp du profil actif
                timestamp: episodeState?.timestamp || 0
              };
            });
          
          listeningEps.push(...podcastListeningEpisodes);
        });
        
        // Trier par date de dernière écoute (timestamp) décroissante
        listeningEps.sort((a, b) => b.timestamp - a.timestamp);
        
        // Prendre les 5 premiers épisodes maximum
        const uniquePodcastIds = new Set<string>();
        const filteredEpisodes = listeningEps.filter(episode => {
          // Ne pas inclure plus d'un épisode du même podcast
          if (!uniquePodcastIds.has(episode.podcastId)) {
            uniquePodcastIds.add(episode.podcastId);
            return true;
          }
          return false;
        }).slice(0, 5);
        
        setListeningEpisodes(filteredEpisodes);

        // Déterminer quels types de podcasts ont du contenu
        const typesWithContent: PodcastType[] = [];
        
        // Pour chaque type de podcast, vérifier s'il existe au moins un podcast de ce type
        for (const type of Object.values(PodcastType)) {
          // Filtrer les podcasts par type
          const podcastsOfType = podcasts.filter(podcast => 
            podcast.types.includes(type)
          );
          
          if (podcastsOfType.length > 0) {
            typesWithContent.push(type);
          }
        }
        
        setPodcastTypeWithContent(typesWithContent);
      } catch (error) {
        console.error('Erreur lors du chargement des épisodes en cours d\'écoute:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadListeningEpisodes();
  }, [activeProfile]); // Recharger lorsque le profil actif change

  const handleEpisodePress = (episode: ContinueListeningEpisode) => {
    // Navigation vers la fiche détaillée de l'épisode
    navigation.navigate('EpisodeDetails', {
      podcastId: episode.podcastId,
      episodeId: episode.id
    });
  };

  const handleLibraryPress = () => {
    // Navigation vers la bibliothèque avec l'ID du profil actif
    navigation.navigate('Library', {
      profileId: activeProfile?.id || ''
    });
  };

  const handlePlaylistsPress = () => {
    // Navigation vers les playlists avec l'ID du profil actif
    navigation.navigate('Playlists', {
      profileId: activeProfile?.id || ''
    });
  };

  const handleDiscoverPress = (podcastType: PodcastType) => {
    // Navigation vers la découverte par thématique avec l'ID du profil actif
    navigation.navigate('ThemePodcasts', {
      theme: podcastType,
      profileId: activeProfile?.id || ''
    });
  };

  const renderContinueListeningItem = ({ item }: { item: ContinueListeningEpisode }) => (
    <TouchableOpacity 
      style={styles.episodeItem}
      onPress={() => handleEpisodePress(item)}
    >
      <Image 
        source={{ uri: item.cover || 'https://via.placeholder.com/150' }}
        style={styles.episodeCover}
      />
      <View style={styles.episodeInfo}>
        <Typography variant="caption" numberOfLines={1} style={styles.episodeName}>
          {item.name}
        </Typography>
        <Typography variant="caption" numberOfLines={1} style={styles.podcastName}>
          {item.podcastName}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  if (!activeProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Typography variant="subtitle" style={styles.emptyStateText}>
          Aucun profil actif. Veuillez sélectionner un profil.
        </Typography>
        <TouchableOpacity 
          style={styles.selectProfileButton}
          onPress={() => navigation.navigate('ChangeProfile', {})}
        >
          <Typography variant="body" style={styles.selectProfileButtonText}>
            Sélectionner un profil
          </Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête avec avatar */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ChangeProfile', {})}
            style={styles.avatarContainer}
          >
            <Avatar
              size={60}
              avatarIndex={activeProfile.avatar}
              disabled
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Section "Reprendre l'écoute" */}
        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Reprendre l'écoute
          </Typography>
          
          {listeningEpisodes.length > 0 ? (
            <FlatList
              data={listeningEpisodes}
              renderItem={renderContinueListeningItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.episodesList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Typography variant="body" style={styles.emptyStateText}>
                Tu n'as pas encore commencé d'épisodes.
              </Typography>
            </View>
          )}
        </View>

        {/* Section "Ton espace" */}
        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Ton espace
          </Typography>
          
          <View style={styles.spaceContainer}>
            <TouchableOpacity 
              style={[styles.spaceItem, { backgroundColor: COLORS.primary }]}
              onPress={handleLibraryPress}
            >
              <Typography variant="subtitle" style={styles.spaceItemText}>
                Ma bibliothèque
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.spaceItem, { backgroundColor: COLORS.primary }]}
              onPress={handlePlaylistsPress}
            >
              <Typography variant="subtitle" style={styles.spaceItemText}>
                Mes playlists
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section "Découvrir" */}
        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Découvrir
          </Typography>
          
          <View style={styles.discoverContainer}>
            {podcastTypeEntries
              .filter(entry => podcastTypeWithContent.includes(entry.type))
              .map((entry) => (
                <TouchableOpacity 
                  key={entry.key}
                  style={styles.discoverItem}
                  onPress={() => handleDiscoverPress(entry.type)}
                >
                  <Typography variant="subtitle" style={styles.discoverItemTitle}>
                    {entry.type}
                  </Typography>
                  <Typography variant="caption" style={styles.discoverItemDescription}>
                    {entry.description}
                  </Typography>
                </TouchableOpacity>
              ))}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  selectProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  selectProfileButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  searchButton: {
    padding: SPACING.sm,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  episodesList: {
    paddingVertical: SPACING.sm,
  },
  episodeItem: {
    width: 150,
    marginRight: SPACING.md,
  },
  episodeCover: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: COLORS.cardBackground,
  },
  episodeInfo: {
    marginTop: SPACING.xs,
  },
  episodeName: {
    color: COLORS.text,
  },
  podcastName: {
    color: COLORS.textSecondary,
  },
  emptyStateContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  spaceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spaceItem: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceItemText: {
    color: COLORS.text,
    textAlign: 'center',
  },
  discoverContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  discoverItem: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  discoverItemTitle: {
    marginBottom: SPACING.xs,
  },
  discoverItemDescription: {
    color: COLORS.textSecondary,
  },
});

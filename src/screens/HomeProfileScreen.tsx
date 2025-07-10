import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList,
  Animated
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { Avatar } from '../components/Avatar';
import { COLORS, SPACING } from '../utils/theme';
import { RootStackParamList } from '../types/navigation';
import { PodcastService } from '../services/PodcastService';
import { ProfileService } from '../services/ProfileService';
import { Episode, EpisodeStatus, PodcastType, PodcastTypeDescription, Podcast } from '../types/podcast';
import { Profile } from '../types/profile';

type HomeProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HomeProfile'
>;

type HomeProfileScreenRouteProp = RouteProp<
  RootStackParamList,
  'HomeProfile'
>;

interface ContinueListeningEpisode extends Episode {
  podcastName: string;
  podcastId: string;
}

export const HomeProfileScreen: React.FC = () => {
  const navigation = useNavigation<HomeProfileScreenNavigationProp>();
  const route = useRoute<HomeProfileScreenRouteProp>();
  const { profileId } = route.params || {};

  const [listeningEpisodes, setListeningEpisodes] = useState<ContinueListeningEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [podcastTypeWithContent, setPodcastTypeWithContent] = useState<PodcastType[]>([]);
  
  // Animation de pulsation
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  
  // Démarrer l'animation de pulsation
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (loading) {
          startPulseAnimation();
        }
      });
    };
    
    if (loading) {
      startPulseAnimation();
    }
    
    return () => {
      // Arrêter l'animation si le composant est démonté
      pulseAnim.stopAnimation();
    };
  }, [loading, pulseAnim]);
  
  // Créer un tableau des types de podcasts pour la section "Découvrir"
  const podcastTypeEntries = Object.entries(PodcastType).map(([key, value]) => ({
    key,
    type: value,
    description: PodcastTypeDescription[key as keyof typeof PodcastTypeDescription]
  }));

  // Utiliser useFocusEffect pour recharger les données à chaque fois que l'écran est affiché
  useFocusEffect(
    React.useCallback(() => {
      const loadListeningEpisodes = async () => {
        try {
          setLoading(true);
          
          // Récupérer les détails du profil si un profileId est fourni
          if (profileId) {
            const profileDetails = await ProfileService.getProfileById(profileId);
            setActiveProfile(profileDetails);
          }
          
          // Récupérer tous les podcasts
          const podcasts = await PodcastService.getPodcasts();
          
          // Récupérer tous les épisodes en cours d'écoute
          const listeningEps: ContinueListeningEpisode[] = [];
          
          podcasts.forEach(podcast => {
            const podcastListeningEpisodes = podcast.episodes
              .filter(episode => episode.status === EpisodeStatus.LISTENING)
              .map(episode => ({
                ...episode,
                podcastName: podcast.name,
                podcastId: podcast.id
              }));
            
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
          
          // Optimisation: filtrer les podcasts par type en mémoire au lieu de faire des appels multiples
          // Créer un Map pour stocker les podcasts par type
          const podcastsByType = new Map<string, Podcast[]>();
          
          // Initialiser le Map avec tous les types de podcast
          Object.values(PodcastType).forEach(type => {
            podcastsByType.set(type, []);
          });
          
          // Classer chaque podcast dans les types correspondants
          podcasts.forEach(podcast => {
            podcast.types.forEach(type => {
              const typePodcasts = podcastsByType.get(type) || [];
              typePodcasts.push(podcast);
              podcastsByType.set(type, typePodcasts);
            });
          });
          
          // Déterminer quels types ont du contenu
          Object.values(PodcastType).forEach(type => {
            const podcastsOfType = podcastsByType.get(type) || [];
            if (podcastsOfType.length > 0) {
              typesWithContent.push(type);
            }
          });
          
          setPodcastTypeWithContent(typesWithContent);
        } catch (error) {
          console.error('Erreur lors du chargement des épisodes en cours d\'\'écoute:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadListeningEpisodes();
      
      // Fonction de nettoyage (optionnelle)
      return () => {
        // Annuler les requêtes en cours si nécessaire
      };
    }, [profileId]) // Dépendance à profileId pour recharger si le profil change
  );

  const handleEpisodePress = (episode: ContinueListeningEpisode) => {
    // Navigation vers la fiche détaillée de l'épisode
    navigation.navigate('EpisodeDetails', {
      podcastId: episode.podcastId,
      episodeId: episode.id
    });
  };

  const handleLibraryPress = () => {
    // Navigation vers la bibliothèque
    navigation.navigate('Library', {
      profileId: profileId || ''
    });
  };

  const handlePlaylistsPress = () => {
    // Navigation vers les playlists
    navigation.navigate('Playlists', {
      profileId: profileId || ''
    });
  };

  const handleDiscoverPress = (podcastType: PodcastType) => {
    // Navigation vers la découverte par thématique
    navigation.navigate('ThemePodcasts', {
      theme: podcastType,
      profileId: profileId || ''
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête avec avatar */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ChangeProfile', {})}
            style={styles.avatarContainer}
          >
            {activeProfile ? (
              <Avatar
                size={60}
                avatarIndex={activeProfile.avatar}
                disabled
              />
            ) : (
              <Image 
                source={require('../../assets/avatar.png')}
                style={styles.avatar}
              />
            )}
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
            {loading ? (
              // Afficher des cartes de chargement pulsantes
              Array.from({ length: 4 }).map((_, index) => (
                <Animated.View 
                  key={`loading-${index}`}
                  style={[
                    styles.discoverItem,
                    styles.loadingItem,
                    { opacity: pulseAnim }
                  ]}
                />
              ))
            ) : (
              // Afficher d'abord la carte "Tous les podcasts"
              [
                <TouchableOpacity 
                  key="all-podcasts"
                  style={styles.discoverItem}
                  onPress={() => navigation.navigate('ThemePodcasts', {
                    theme: 'all',
                    profileId: profileId || ''
                  })}
                >
                  <Typography variant="subtitle" style={styles.discoverItemTitle}>
                    Tous les podcasts
                  </Typography>
                  <Typography variant="caption" style={styles.discoverItemDescription}>
                    Découvrir l'ensemble des podcasts disponibles
                  </Typography>
                </TouchableOpacity>,
                // Puis afficher les cartes de thèmes
                ...podcastTypeEntries
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
                ))
              ]
            )}
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
  sectionSubtitle: {
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
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
    width: '48%',
    height: 150,
    borderRadius: 12,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceItemText: {
    color: '#000000',
    textAlign: 'center',
  },
  discoverContainer: {
    marginTop: SPACING.md,
  },
  discoverItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  discoverItemTitle: {
    marginBottom: SPACING.xs,
  },
  discoverItemDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  loadingItem: {
    backgroundColor: COLORS.cardBackground,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

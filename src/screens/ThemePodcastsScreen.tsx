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
import { PodcastItem } from '../components/PodcastItem';
import { COLORS, SPACING } from '../utils/theme';
import { PodcastService } from '../services/PodcastService';
import { ProfileService } from '../services/ProfileService';
import { RootStackParamList } from '../types/navigation';
import { Podcast, PodcastType } from '../types/podcast';

type ThemePodcastsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ThemePodcasts'
>;

type ThemePodcastsScreenRouteProp = RouteProp<
  RootStackParamList,
  'ThemePodcasts'
>;

export const ThemePodcastsScreen: React.FC = () => {
  const navigation = useNavigation<ThemePodcastsScreenNavigationProp>();
  const route = useRoute<ThemePodcastsScreenRouteProp>();
  const { theme, profileId } = route.params;
  // Convertir le thème en PodcastType sauf si c'est "all"
  const isAllPodcasts = theme === 'all';
  const podcastTheme = isAllPodcasts ? null : theme as PodcastType;

  const [loading, setLoading] = useState(true);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [profileAgeRanges, setProfileAgeRanges] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger le profil pour obtenir les tranches d'âge
        const profile = await ProfileService.getProfileById(profileId);
        if (profile) {
          setProfileAgeRanges(profile.ageRanges);
        }
        
        // Charger tous les podcasts
        const allPodcasts = await PodcastService.getPodcasts();
        
        // Filtrer les podcasts par thème et tranche d'âge
        const filteredPodcasts = allPodcasts.filter(podcast => {
          // Si "Tous les podcasts" est sélectionné, ne pas filtrer par thème
          const hasTheme = isAllPodcasts ? true : podcast.types.includes(podcastTheme!);
          
          // Vérifier si le podcast est adapté à l'âge du profil
          const hasMatchingAgeRange = podcast.ageRanges.some(ageRange => 
            profile?.ageRanges.includes(ageRange)
          );
          
          return hasTheme && hasMatchingAgeRange;
        });
        
        setPodcasts(filteredPodcasts);
      } catch (error) {
        console.error('Erreur lors du chargement des podcasts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [profileId, podcastTheme]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePodcastPress = (podcast: Podcast) => {
    navigation.navigate('PodcastDetails', { podcastId: podcast.id });
  };

  const toggleSubscription = async (podcastId: string) => {
    try {
      // Récupérer le podcast actuel
      const podcast = podcasts.find(p => p.id === podcastId);
      if (!podcast) return;
      
      // Mettre à jour l'abonnement au podcast dans le stockage persistant
      const updatedPodcast = await PodcastService.updatePodcast(
        podcastId,
        { subscription: !podcast.subscription }
      );
      
      if (updatedPodcast) {
        // Mettre à jour l'état local avec le podcast mis à jour
        const updatedPodcasts = podcasts.map(p => 
          p.id === podcastId ? updatedPodcast : p
        );
        
        setPodcasts(updatedPodcasts);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    }
  };

  const renderPodcastItem = ({ item }: { item: Podcast }) => (
    <PodcastItem 
      podcast={item}
      onPress={handlePodcastPress}
      onToggleSubscription={toggleSubscription}
      showThemeTag={false}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography variant="body" style={styles.loadingText}>
            Chargement des podcasts...
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
        <Typography variant="title" center style={styles.headerTitle}>
          {isAllPodcasts ? "Tous les podcasts" : theme}
        </Typography>
        <View style={styles.placeholder} />
      </View>

      {podcasts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="body" center>
            Aucun podcast trouvé pour cette thématique et cette tranche d'âge.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={podcasts}
          renderItem={renderPodcastItem}
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
  listContent: {
    padding: SPACING.md,
  },
});

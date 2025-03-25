import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { PodcastItem } from '../components/PodcastItem';
import { COLORS, SPACING, SIZES } from '../utils/theme';
import { PodcastService } from '../services/PodcastService';
import { ProfileService } from '../services/ProfileService';
import { RootStackParamList } from '../types/navigation';
import { Podcast, PodcastType } from '../types/podcast';

type LibraryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Library'
>;

type LibraryScreenRouteProp = RouteProp<
  RootStackParamList,
  'Library'
>;

export const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<LibraryScreenNavigationProp>();
  const route = useRoute<LibraryScreenRouteProp>();
  const { profileId } = route.params;

  const [loading, setLoading] = useState(true);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
  const [profileAgeRanges, setProfileAgeRanges] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("Tous les thèmes");
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Créer un tableau des types de podcasts pour le filtre
  const podcastThemes = ["Tous les thèmes", ...Object.values(PodcastType)];

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
        
        // Filtrer les podcasts par tranche d'âge et abonnement
        const libraryPodcasts = allPodcasts.filter(podcast => {
          // Vérifier si le podcast est adapté à l'âge du profil
          const hasMatchingAgeRange = podcast.ageRanges.some(ageRange => 
            profile?.ageRanges.includes(ageRange)
          );
          
          // Vérifier si l'utilisateur est abonné au podcast
          const isSubscribed = podcast.subscription === true;
          
          return hasMatchingAgeRange && isSubscribed;
        });
        
        setPodcasts(libraryPodcasts);
        setFilteredPodcasts(libraryPodcasts);
      } catch (error) {
        console.error('Erreur lors du chargement des podcasts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [profileId]);

  // Filtrer les podcasts par thème sélectionné
  useEffect(() => {
    if (selectedTheme === "Tous les thèmes") {
      setFilteredPodcasts(podcasts);
    } else {
      const filtered = podcasts.filter(podcast => 
        podcast.types.includes(selectedTheme as PodcastType)
      );
      setFilteredPodcasts(filtered);
    }
  }, [selectedTheme, podcasts]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePodcastPress = (podcast: Podcast) => {
    navigation.navigate('PodcastDetails', { podcastId: podcast.id });
  };

  const toggleSubscription = async (podcastId: string) => {
    try {
      // Mettre à jour l'abonnement au podcast
      const updatedPodcasts = podcasts.map(podcast => {
        if (podcast.id === podcastId) {
          return {
            ...podcast,
            subscription: !podcast.subscription
          };
        }
        return podcast;
      });
      
      setPodcasts(updatedPodcasts);
      
      // Dans une implémentation réelle, nous appellerions le service comme ceci:
      // await PodcastService.togglePodcastSubscription(podcastId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    }
  };

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
    setShowThemeModal(false);
  };

  const renderPodcastItem = ({ item }: { item: Podcast }) => (
    <PodcastItem 
      podcast={item}
      onPress={handlePodcastPress}
      onToggleSubscription={toggleSubscription}
      showThemeTag={true}
    />
  );

  const renderThemeItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={[
        styles.themeItem, 
        selectedTheme === item ? styles.selectedThemeItem : {}
      ]}
      onPress={() => handleThemeSelect(item)}
    >
      <Typography 
        variant="body" 
        style={[
          styles.themeItemText,
          selectedTheme === item ? styles.selectedThemeItemText : {}
        ]}
      >
        {item}
      </Typography>
    </TouchableOpacity>
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
          Ma Bibliothèque
        </Typography>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.themeFilterButton}
          onPress={() => setShowThemeModal(true)}
        >
          <Typography variant="body" style={styles.filterButtonText}>
            {selectedTheme}
          </Typography>
          <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {filteredPodcasts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="body" center>
            Aucun podcast trouvé dans votre bibliothèque.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filteredPodcasts}
          renderItem={renderPodcastItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal pour sélectionner le thème */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="subtitle" style={styles.modalTitle}>
                Filtrer par thème
              </Typography>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowThemeModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={podcastThemes}
              renderItem={renderThemeItem}
              keyExtractor={item => item}
              contentContainerStyle={styles.themesList}
            />
          </View>
        </View>
      </Modal>
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
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.text,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  themeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginHorizontal: SPACING.sm,
  },
  filterButtonText: {
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  listContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  themesList: {
    padding: SPACING.md,
  },
  themeItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedThemeItem: {
    backgroundColor: COLORS.cardBackground,
  },
  themeItemText: {
    color: COLORS.text,
  },
  selectedThemeItemText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

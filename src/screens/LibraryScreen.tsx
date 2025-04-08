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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { PodcastItem } from '../components/PodcastItem';
import { COLORS, SPACING, SIZES } from '../utils/theme';
import { PodcastService } from '../services/PodcastService';
import { RootStackParamList } from '../types/navigation';
import { Podcast, PodcastType } from '../types/podcast';
import { useActiveProfile } from '../contexts/ActiveProfileContext';

type LibraryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Library'
>;

export const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<LibraryScreenNavigationProp>();
  const { activeProfile } = useActiveProfile();

  const [loading, setLoading] = useState(true);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("Tous les thèmes");
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Créer un tableau des types de podcasts pour le filtre
  const podcastThemes = ["Tous les thèmes", ...Object.values(PodcastType)];

  useEffect(() => {
    const loadPodcasts = async () => {
      if (!activeProfile) return;
      
      try {
        setLoading(true);
        
        // Charger tous les podcasts
        const allPodcasts = await PodcastService.getPodcasts();
        
        // Filtrer les podcasts par tranche d'âge et abonnement pour le profil actif
        const libraryPodcasts = allPodcasts.filter(podcast => {
          // Vérifier si le podcast est adapté à l'âge du profil
          const hasMatchingAgeRange = podcast.ageRanges.some(ageRange => 
            activeProfile.ageRanges.includes(ageRange)
          );
          
          // Vérifier si le profil actif est abonné au podcast
          const isSubscribed = podcast.subscription?.some(
            sub => sub.profileId === activeProfile.id && sub.subscription
          ) || false;
          
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
    
    loadPodcasts();
  }, [activeProfile]);

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
      if (!activeProfile) return;
      
      // Appeler le service pour mettre à jour l'abonnement
      await PodcastService.toggleSubscription(podcastId, activeProfile.id);
      
      // Recharger les podcasts après la mise à jour
      const allPodcasts = await PodcastService.getPodcasts();
      
      // Appliquer à nouveau les filtres
      const libraryPodcasts = allPodcasts.filter(podcast => {
        const hasMatchingAgeRange = podcast.ageRanges.some(ageRange => 
          activeProfile.ageRanges.includes(ageRange)
        );
        
        const isSubscribed = podcast.subscription?.some(
          sub => sub.profileId === activeProfile.id && sub.subscription
        ) || false;
        
        return hasMatchingAgeRange && isSubscribed;
      });
      
      setPodcasts(libraryPodcasts);
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
      showEpisodeCount={false}
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

  if (!activeProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Typography variant="subtitle" style={styles.emptyText}>
          Aucun profil actif. Veuillez sélectionner un profil.
        </Typography>
        <TouchableOpacity 
          style={styles.selectProfileButton}
          onPress={() => navigation.navigate('ChangeProfile', { initialProfileId: undefined })}
        >
          <Typography variant="body" style={styles.selectProfileButtonText}>
            Sélectionner un profil
          </Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          <Image 
            source={require('../../assets/empty_library.png')} 
            style={styles.emptyImage}
          />
          <Typography variant="subtitle" style={styles.emptyTitle}>
            Ta bibliothèque est vide
          </Typography>
          <Typography variant="body" style={styles.emptyText}>
            Abonne-toi à des podcasts pour les retrouver ici
          </Typography>
          <TouchableOpacity 
            style={styles.discoverButton}
            onPress={() => navigation.navigate('HomeProfile', { profileId: '' })}
          >
            <Typography variant="body" style={styles.discoverButtonText}>
              Découvrir des podcasts
            </Typography>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPodcasts}
          renderItem={renderPodcastItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.podcastsList}
        />
      )}

      {/* Modal pour la sélection des thèmes */}
      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="subtitle" style={styles.modalTitle}>
                Filtrer par thème
              </Typography>
              <TouchableOpacity 
                onPress={() => setShowThemeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={podcastThemes}
              renderItem={renderThemeItem}
              keyExtractor={(item) => item}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // Même taille que le bouton retour pour équilibrer
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  themeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  filterButtonText: {
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  podcastsList: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  discoverButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  discoverButtonText: {
    color: COLORS.text,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  themesList: {
    paddingBottom: SPACING.lg,
  },
  themeItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBackground,
  },
  selectedThemeItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  themeItemText: {
    color: COLORS.text,
  },
  selectedThemeItemText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

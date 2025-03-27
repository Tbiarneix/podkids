import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { 
  useNavigation, 
  useRoute, 
  RouteProp 
} from '@react-navigation/native';
import { 
  NativeStackNavigationProp 
} from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { SelectionButton } from '../components/SelectionButton';
import { COLORS, SPACING } from '../utils/theme';
import { PodcastService } from '../services/PodcastService';
import { RootStackParamList } from '../types/navigation';
import { AgeRange, PodcastType, PodcastTypeDescription } from '../types/podcast';

type EditPodcastScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditPodcast'
>;

type EditPodcastScreenRouteProp = RouteProp<
  RootStackParamList,
  'EditPodcast'
>;

export const EditPodcastScreen: React.FC = () => {
  const navigation = useNavigation<EditPodcastScreenNavigationProp>();
  const route = useRoute<EditPodcastScreenRouteProp>();
  const { podcastId } = route.params;

  const [loading, setLoading] = useState(true);
  const [podcastUrl, setPodcastUrl] = useState('');
  const [podcastName, setPodcastName] = useState('');
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<AgeRange[]>([]);
  const [selectedPodcastTypes, setSelectedPodcastTypes] = useState<PodcastType[]>([]);
  const [isDeletable, setIsDeletable] = useState(true);

  // Convertir les enums en tableaux pour l'affichage
  const ageRanges = Object.values(AgeRange);
  const podcastTypes = Object.values(PodcastType);

  useEffect(() => {
    const loadPodcast = async () => {
      try {
        setLoading(true);
        const podcast = await PodcastService.getPodcastById(podcastId);
        if (podcast) {
          setPodcastName(podcast.name);
          setPodcastUrl(podcast.url);
          setSelectedAgeRanges(podcast.ageRanges);
          setSelectedPodcastTypes(podcast.types);
          setIsDeletable(podcast.deleteable !== undefined ? podcast.deleteable : true);
        } else {
          // Podcast non trouvé, afficher une erreur
          navigation.navigate('Notification', {
            type: 'error' as const,
            message: 'Podcast non trouvé',
            redirectTo: 'Settings'
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du podcast:', error);
        navigation.navigate('Notification', {
          type: 'error' as const,
          message: 'Erreur lors du chargement du podcast',
          redirectTo: 'Settings'
        });
      } finally {
        setLoading(false);
      }
    };

    loadPodcast();
  }, [podcastId, navigation]);

  // Fonction pour afficher le texte des tranches d'âge de façon plus lisible
  const formatAgeRange = (ageRange: string): string => {
    switch (ageRange) {
      case AgeRange.UNDER_3:
        return '0/3 ans';
      case AgeRange.BETWEEN_4_AND_6:
        return '3/6 ans';
      case AgeRange.BETWEEN_7_AND_9:
        return '6/9 ans';
      case AgeRange.BETWEEN_10_AND_12:
        return '9/12 ans';
      case AgeRange.BETWEEN_13_AND_15:
        return '12/15 ans';
      case AgeRange.OVER_15:
        return '15+ ans';
      default:
        return String(ageRange);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleAgeRange = (ageRange: AgeRange) => {
    setSelectedAgeRanges(prev => {
      if (prev.includes(ageRange)) {
        return prev.filter(item => item !== ageRange);
      } else {
        return [...prev, ageRange];
      }
    });
  };

  const togglePodcastType = (podcastType: PodcastType) => {
    setSelectedPodcastTypes(prev => {
      if (prev.includes(podcastType)) {
        return prev.filter(item => item !== podcastType);
      } else {
        return [...prev, podcastType];
      }
    });
  };

  const handleUpdatePodcast = async () => {
    try {
      // Vérification qu'au moins une tranche d'âge est sélectionnée
      if (selectedAgeRanges.length === 0) {
        navigation.navigate('Notification', {
          type: 'error' as const,
          message: 'Veuillez sélectionner au moins une tranche d\'âge pour ce podcast'
        });
        return;
      }
      
      // Vérification qu'au moins une thématique est sélectionnée
      if (selectedPodcastTypes.length === 0) {
        navigation.navigate('Notification', {
          type: 'error' as const,
          message: 'Veuillez sélectionner au moins une thématique pour ce podcast'
        });
        return;
      }
      
      // Tout est valide, on peut mettre à jour le podcast
      setLoading(true);
      
      await PodcastService.updatePodcast(podcastId, {
        ageRanges: selectedAgeRanges,
        types: selectedPodcastTypes
      });
      
      // Naviguer vers l'écran de succès
      navigation.navigate('Notification', {
        type: 'success' as const,
        message: 'Le podcast a bien été mis à jour !',
        redirectTo: 'Settings'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du podcast:', error);
      
      navigation.navigate('Notification', {
        type: 'error' as const,
        message: 'Une erreur est survenue lors de la mise à jour du podcast'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePodcast = () => {
    Alert.alert(
      'Supprimer le podcast',
      'Êtes-vous sûr de vouloir supprimer ce podcast ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await PodcastService.deletePodcast(podcastId);
              
              navigation.navigate('Notification', {
                type: 'success' as const,
                message: 'Le podcast a bien été supprimé !',
                redirectTo: 'Settings'
              });
            } catch (error) {
              console.error('Erreur lors de la suppression du podcast:', error);
              
              navigation.navigate('Notification', {
                type: 'error' as const,
                message: 'Une erreur est survenue lors de la suppression du podcast'
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center style={styles.headerTitle}>
          Modifier un podcast
        </Typography>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Typography variant="body" style={styles.sectionTitle}>
            Nom du podcast
          </Typography>
          <Typography variant="body" style={styles.podcastName}>
            {podcastName}
          </Typography>
        </View>

        <View style={styles.section}>
          <Typography variant="body" style={styles.sectionTitle}>
            URL du podcast
          </Typography>
          <Typography variant="body" style={styles.podcastUrl}>
            {podcastUrl}
          </Typography>
        </View>

        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Tranche d'âge
          </Typography>
          <Typography variant="caption" style={styles.sectionDescription}>
            Sélectionnez une ou plusieurs tranches d'âge pour ce podcast
          </Typography>
          <View style={styles.ageRangesContainer}>
            {ageRanges.map(ageRange => (
              <SelectionButton
                key={ageRange}
                label={formatAgeRange(ageRange)}
                customStyle={styles.ageRangeButton}
                selected={selectedAgeRanges.includes(ageRange)}
                onPress={() => toggleAgeRange(ageRange)}
                size="medium"
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Thématiques
          </Typography>
          <Typography variant="caption" style={styles.sectionDescription}>
            Sélectionnez une ou plusieurs thématiques pour ce podcast
          </Typography>
          <View style={styles.podcastTypesContainer}>
            {podcastTypes.map(podcastType => {
              // Convertir le type PodcastType en keyof typeof PodcastTypeDescription
              const podcastTypeKey = podcastType as unknown as keyof typeof PodcastTypeDescription;
              return (
                <SelectionButton
                  key={podcastType}
                  label={podcastType}
                  description={PodcastTypeDescription[podcastTypeKey]}
                  selected={selectedPodcastTypes.includes(podcastType)}
                  onPress={() => togglePodcastType(podcastType)}
                  fullWidth
                />
              );
            })}
          </View>
        </View>

        <Button
          title="Mettre à jour"
          onPress={handleUpdatePodcast}
          fullWidth
          style={styles.updateButton}
        />

        {isDeletable && (
          <Button
            title="Supprimer le podcast"
            onPress={handleDeletePodcast}
            fullWidth
            style={styles.deleteButton}
            variant="outline"
          />
        )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  podcastName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  podcastUrl: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  ageRangesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ageRangeButton: {
    width: '30%',  // Environ un tiers de la largeur pour avoir 3 boutons par ligne
    marginBottom: SPACING.md,
  },
  podcastTypesContainer: {
    flexDirection: 'column',
  },
  updateButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  deleteButton: {
    marginTop: SPACING.md,
    backgroundColor: 'transparent',
    borderColor: COLORS.error,
  },
  rawDataButton: {
    marginTop: SPACING.xl,
    backgroundColor: 'transparent',
    borderColor: COLORS.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  rawDataScrollView: {
    maxHeight: '80%',
  },
  rawDataText: {
    color: COLORS.text,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  closeModalButton: {
    marginTop: SPACING.lg,
  },
});

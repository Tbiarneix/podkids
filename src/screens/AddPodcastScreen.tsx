import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { SelectionButton } from '../components/SelectionButton';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { AgeRange, PodcastType, PodcastTypeDescription } from '../types/podcast';
import { PodcastService } from '../services/PodcastService';

type AddPodcastScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddPodcast'
>;

export const AddPodcastScreen: React.FC = () => {
  const navigation = useNavigation<AddPodcastScreenNavigationProp>();
  
  const [podcastUrl, setPodcastUrl] = useState('');
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<AgeRange[]>([]);
  const [selectedPodcastTypes, setSelectedPodcastTypes] = useState<PodcastType[]>([]);
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);

  // Convertir les enums en tableaux pour l'affichage
  const ageRanges = Object.values(AgeRange);
  const podcastTypes = Object.values(PodcastType);

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
      // Si la tranche d'âge est déjà sélectionnée, on la retire
      if (prev.includes(ageRange)) {
        return prev.filter(item => item !== ageRange);
      } 
      // Sinon, on l'ajoute
      else {
        return [...prev, ageRange];
      }
    });
  };

  const togglePodcastType = (podcastType: PodcastType) => {
    setSelectedPodcastTypes(prev => {
      // Si le type est déjà sélectionné, on le retire
      if (prev.includes(podcastType)) {
        return prev.filter(item => item !== podcastType);
      } 
      // Sinon, on l'ajoute
      else {
        return [...prev, podcastType];
      }
    });
  };

  const validateUrl = (url: string) => {
    // Expression régulière plus permissive pour valider une URL de flux RSS
    const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;
    
    if (!url.trim()) {
      setUrlError("L'URL du podcast est requise");
      return false;
    }
    
    if (!urlRegex.test(url)) {
      setUrlError("L'URL du podcast n'est pas valide");
      return false;
    }
    
    setUrlError('');
    return true;
  };

  const handleAddPodcast = async () => {
    try {
      // Validation de l'URL
      if (!validateUrl(podcastUrl)) {
        return;
      }
      
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
      
      // Tout est valide, on peut ajouter le podcast
      setLoading(true);
      
      // Vérifier si le podcast existe déjà
      const exists = await PodcastService.podcastExistsByUrl(podcastUrl);
      if (exists) {
        navigation.navigate('PodcastError', {
          errorType: 'duplicate',
          errorMessage: 'Ce podcast existe déjà dans votre bibliothèque'
        });
        return;
      }
      
      // Ajouter le podcast
      const newPodcast = await PodcastService.addPodcast(
        podcastUrl,
        selectedAgeRanges,
        selectedPodcastTypes
      );
      
      // Naviguer vers l'écran de succès
      navigation.navigate('PodcastSuccess', {
        podcastName: newPodcast.name
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du podcast:', error);
      
      // Déterminer le message d'erreur à afficher
      let errorMessage = 'Une erreur est survenue lors de l\'ajout du podcast';
      let errorType = 'unknown';
      
      if (error instanceof Error) {
        if (error.message.includes('Erreur HTTP')) {
          errorMessage = 'Impossible de se connecter au flux du podcast';
          errorType = 'connection';
        } else if (error.message.includes('parse')) {
          errorMessage = 'Le format du flux RSS n\'est pas reconnu';
          errorType = 'format';
        }
      }
      
      // Naviguer vers l'écran d'erreur
      navigation.navigate('PodcastError', { 
        errorType, 
        errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center style={styles.headerTitle}>
          Ajouter un podcast
        </Typography>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            URL du flux du podcast
          </Typography>
          <TextInput
            style={[styles.input, urlError ? styles.inputError : {}]}
            placeholder="https://example.com/feed.xml"
            placeholderTextColor={COLORS.textSecondary}
            value={podcastUrl}
            onChangeText={(text) => {
              setPodcastUrl(text);
              if (urlError) validateUrl(text);
            }}
            autoCapitalize="none"
            keyboardType="url"
          />
          {urlError ? (
            <Typography variant="caption" style={styles.errorText}>
              {urlError}
            </Typography>
          ) : null}
        </View>

        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Tranches d'âge
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
                selected={selectedAgeRanges.includes(ageRange as AgeRange)}
                onPress={() => toggleAgeRange(ageRange as AgeRange)}
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
            Sélectionnez les thématiques qui correspondent à ce podcast
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
                  selected={selectedPodcastTypes.includes(podcastType as PodcastType)}
                  onPress={() => togglePodcastType(podcastType as PodcastType)}
                  fullWidth
                />
              );
            })}
          </View>
        </View>

        <Button
          title={loading ? "Chargement..." : "Ajouter le podcast"}
          onPress={handleAddPodcast}
          fullWidth
          style={styles.addButton}
          disabled={loading}
        />
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Typography variant="body" center style={styles.loadingText}>
              Récupération des informations du podcast...
            </Typography>
          </View>
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
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
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
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  ageRangesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  ageRangeButton: {
    width: '29%',
  },
  podcastTypesContainer: {
    marginTop: SPACING.sm,
  },
  addButton: {
    marginVertical: SPACING.xl,
  },
  loadingContainer: {
    marginVertical: SPACING.md,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
  },
});

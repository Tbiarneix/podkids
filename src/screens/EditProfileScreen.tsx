import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { SelectionButton } from '../components/SelectionButton';
import { COLORS, SPACING, FONTS } from '../utils/theme';
import { AgeRange } from '../types/podcast';
import { ProfileService } from '../services/ProfileService';
import { PodcastService } from '../services/PodcastService';
import { RootStackParamList } from '../types/navigation';
import { Profile } from '../types/profile';
import { getAvatarIndices } from '../utils/avatarUtils';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

type EditProfileScreenRouteProp = RouteProp<
  RootStackParamList,
  'EditProfile'
>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const route = useRoute<EditProfileScreenRouteProp>();
  const { profileId } = route.params;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<AgeRange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Obtenir les indices des avatars disponibles
  const avatarIndices = getAvatarIndices();
  
  // Convertir les enums en tableaux pour l'affichage
  const ageRanges = Object.values(AgeRange);
  
  // Charger les données du profil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await ProfileService.getProfileById(profileId);
        if (profile) {
          setName(profile.name);
          setSelectedAvatar(profile.avatar);
          setSelectedAgeRanges(profile.ageRanges);
        } else {
          // Profil non trouvé, afficher une erreur
          navigation.navigate('Notification', {
            type: 'error' as const,
            message: 'Profil non trouvé',
            redirectTo: 'Settings'
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        navigation.navigate('Notification', {
          type: 'error' as const,
          message: 'Erreur lors du chargement du profil',
          redirectTo: 'Settings'
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileId, navigation]);

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

  const toggleAgeRange = (ageRange: AgeRange) => {
    setSelectedAgeRanges(prev => {
      if (prev.includes(ageRange)) {
        return prev.filter(item => item !== ageRange);
      } else {
        return [...prev, ageRange];
      }
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        // Afficher une erreur si le nom est vide
        navigation.navigate('Notification', {
          type: 'error' as const,
          message: 'Veuillez entrer un nom pour le profil'
        });
        return;
      }

      if (selectedAgeRanges.length === 0) {
        // Afficher une erreur si aucune tranche d'âge n'est sélectionnée
        navigation.navigate('Notification', {
          type: 'error' as const,
          message: 'Veuillez sélectionner au moins une tranche d\'âge'
        });
        return;
      }
      
      // Activer le loader
      setIsLoading(true);
      
      // Récupérer le profil actuel pour comparer les tranches d'âge
      const currentProfile = await ProfileService.getProfileById(profileId);
      if (!currentProfile) {
        throw new Error('Profil non trouvé');
      }
      
      // Vérifier si les tranches d'âge ont changé
      const ageRangesChanged = (
        currentProfile.ageRanges.length !== selectedAgeRanges.length ||
        !currentProfile.ageRanges.every(age => selectedAgeRanges.includes(age))
      );

      // Mettre à jour le profil
      await ProfileService.updateProfile(profileId, {
        name: name.trim(),
        avatar: selectedAvatar,
        ageRanges: selectedAgeRanges
      });
      
      // Si les tranches d'âge ont changé, mettre à jour les podcasts
      if (ageRangesChanged) {
        // Supprimer les podcasts qui ne correspondent plus aux tranches d'âge
        await PodcastService.removePodcastsNotInAgeRanges(selectedAgeRanges);
        
        // Ajouter les podcasts pour les nouvelles tranches d'âge
        await PodcastService.initializePodcastsForAgeRanges(selectedAgeRanges);
      }
      
      // Désactiver le loader
      setIsLoading(false);

      // Afficher une notification de succès et rediriger vers Settings
      navigation.navigate('Notification', {
        type: 'success' as const,
        message: 'Le profil a bien été modifié !',
        redirectTo: 'Settings'
      });
    } catch (error) {
      console.error('Erreur lors de la modification du profil:', error);
      
      // Désactiver le loader en cas d'erreur
      setIsLoading(false);
      
      // Afficher une notification d'erreur
      navigation.navigate('Notification', {
        type: 'error' as const,
        message: 'Erreur lors de la modification du profil'
      });
    }
  };
  
  const handleDelete = async () => {
    try {
      // Activer le loader
      setIsLoading(true);
      
      // Récupérer le profil pour avoir les tranches d'âge
      const profile = await ProfileService.getProfileById(profileId);
      if (!profile) {
        throw new Error('Profil non trouvé');
      }
      
      // Nettoyer les données des podcasts
      await PodcastService.cleanAllPodcastData();
      
      // Supprimer le profil
      await ProfileService.deleteProfile(profileId);
      
      // Désactiver le loader
      setIsLoading(false);
      
      // Afficher une notification de succès et rediriger vers Settings
      navigation.navigate('Notification', {
        type: 'success' as const,
        message: 'Le profil a bien été supprimé !',
        redirectTo: 'Settings'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du profil:', error);
      
      // Désactiver le loader en cas d'erreur
      setIsLoading(false);
      
      // Afficher une notification d'erreur
      navigation.navigate('Notification', {
        type: 'error' as const,
        message: 'Erreur lors de la suppression du profil'
      });
    }
  };
  
  const confirmDelete = () => {
    setShowDeleteConfirmation(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography variant="body" style={styles.loadingText}>
            Chargement du profil...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal de chargement */}
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Typography variant="body" style={styles.loadingText}>
              Modification du profil en cours...
            </Typography>
          </View>
        </View>
      </Modal>
      
      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.confirmationContainer}>
            <Typography variant="subtitle" style={styles.confirmationTitle}>
              Supprimer le profil
            </Typography>
            <Typography variant="body" style={styles.confirmationText}>
              Êtes-vous sûr de vouloir supprimer ce profil ? Cette action supprimera également tous les podcasts et ne peut pas être annulée.
            </Typography>
            <View style={styles.confirmationButtons}>
              <Button
                title="Non"
                onPress={() => setShowDeleteConfirmation(false)}
                style={styles.cancelButton}
                variant="tertiary"
              />
              <Button
                title="Oui"
                onPress={() => {
                  setShowDeleteConfirmation(false);
                  handleDelete();
                }}
                style={[styles.deleteConfirmButton, { backgroundColor: '#d32f2f'}]}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center style={styles.headerTitle}>
          Modifier un profil
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
            Nom
          </Typography>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={text => setName(text)}
            placeholder="Entrez le nom du profil"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={20}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="body" style={styles.sectionTitle}>
            Choisir un avatar
          </Typography>
          <View style={styles.avatarsContainer}>
            {avatarIndices.map((index) => (
              <Avatar
                key={index}
                selected={selectedAvatar === index}
                onPress={() => setSelectedAvatar(index)}
                size={80}
                avatarIndex={index}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="subtitle" style={styles.sectionTitle}>
            Tranche d'âge
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

        <Button
          title="Supprimer"
          onPress={confirmDelete}
          fullWidth
          style={[styles.deleteButton, { backgroundColor: '#d32f2f' }]}
          variant="primary"
        />
        
        <Button
          title="Sauvegarder"
          onPress={handleSave}
          fullWidth
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.text,
    textAlign: 'center',
  },
  confirmationContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmationTitle: {
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  confirmationText: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  deleteConfirmButton: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.text,
  },
  deleteButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
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
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    backgroundColor: COLORS.cardBackground,
    marginBottom: SPACING.md,
  },
  avatarsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SPACING.md,
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
  saveButton: {
    marginBottom: SPACING.xxxl,
  },
});

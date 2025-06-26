import React, { useState } from 'react';
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
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { getAvatarIndices } from '../utils/avatarUtils';

type AddProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddProfile'
>;

export const AddProfileScreen: React.FC = () => {
  const navigation = useNavigation<AddProfileScreenNavigationProp>();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<AgeRange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Obtenir les indices des avatars disponibles
  const avatarIndices = getAvatarIndices();
  
  // Convertir les enums en tableaux pour l'affichage
  const ageRanges = Object.values(AgeRange);
  
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

      // Créer le profil
      await ProfileService.createProfile({
        name: name.trim(),
        avatar: selectedAvatar,
        ageRanges: selectedAgeRanges
      });
      
      // Initialiser les podcasts correspondant aux tranches d'âge sélectionnées
      await PodcastService.initializePodcastsForAgeRanges(selectedAgeRanges);

      // Désactiver le loader
      setIsLoading(false);

      // Afficher une notification de succès et rediriger vers Settings
      navigation.navigate('Notification', {
        type: 'success' as const,
        message: 'Le profil a bien été créé !',
        redirectTo: 'Settings'
      });
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      
      // Désactiver le loader en cas d'erreur
      setIsLoading(false);
      
      // Afficher une notification d'erreur
      navigation.navigate('Notification', {
        type: 'error' as const,
        message: 'Erreur lors de la création du profil'
      });
    }
  };

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
              Création du profil en cours...
            </Typography>
          </View>
        </View>
      </Modal>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center style={styles.headerTitle}>
          Ajouter un profil
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
    width: '30%',
  },
  saveButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
});

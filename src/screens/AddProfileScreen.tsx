import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Text,
  FlatList
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
  const [loading, setLoading] = useState(false);

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

      // Créer le profil
      await ProfileService.createProfile({
        name: name.trim(),
        avatar: selectedAvatar,
        ageRanges: selectedAgeRanges
      });

      // Initialiser les podcasts correspondant aux tranches d'âge sélectionnées
      setLoading(true);
      try {
        await PodcastService.initializePodcastsByAgeRanges(selectedAgeRanges);
      } catch (podcastError) {
        console.error('Erreur lors de l\'initialisation des podcasts:', podcastError);
        // Ne pas bloquer la création du profil si l'initialisation des podcasts échoue
      } finally {
        setLoading(false);
      }

      // Afficher une notification de succès et rediriger vers Settings
      navigation.navigate('Notification', {
        type: 'success' as const,
        message: 'Le profil a bien été créé !',
        redirectTo: 'Settings'
      });
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      
      // Afficher une notification d'erreur
      navigation.navigate('Notification', {
        type: 'error' as const,
        message: 'Erreur lors de la création du profil'
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
          loading={loading}
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

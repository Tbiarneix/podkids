import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  Text,
  ActivityIndicator
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
import { RootStackParamList } from '../types/navigation';
import { Profile } from '../types/profile';

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

      // Mettre à jour le profil
      await ProfileService.updateProfile(profileId, {
        name: name.trim(),
        avatar: selectedAvatar,
        ageRanges: selectedAgeRanges
      });

      // Afficher une notification de succès et rediriger vers Settings
      navigation.navigate('Notification', {
        type: 'success' as const,
        message: 'Le profil a bien été modifié !',
        redirectTo: 'Settings'
      });
    } catch (error) {
      console.error('Erreur lors de la modification du profil:', error);
      
      // Afficher une notification d'erreur
      navigation.navigate('Notification', {
        type: 'error' as const,
        message: 'Erreur lors de la modification du profil'
      });
    }
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
            {[0, 1, 2, 3, 4].map((index) => (
              <Avatar
                key={index}
                selected={selectedAvatar === index}
                onPress={() => setSelectedAvatar(index)}
                size={50}
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
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
});

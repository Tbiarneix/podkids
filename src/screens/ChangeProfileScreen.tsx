import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { Avatar } from '../components/Avatar';
import { PinInput } from '../components/PinInput';
import { COLORS, SPACING } from '../utils/theme';
import { ProfileService } from '../services/ProfileService';
import { PinService } from '../services/PinService';
import { RootStackParamList } from '../types/navigation';
import { Profile } from '../types/profile';

type ChangeProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChangeProfile'
>;

type ChangeProfileScreenRouteProp = RouteProp<
  RootStackParamList,
  'ChangeProfile'
>;

export const ChangeProfileScreen: React.FC = () => {
  const navigation = useNavigation<ChangeProfileScreenNavigationProp>();
  const route = useRoute<ChangeProfileScreenRouteProp>();
  const { initialProfileId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [pinVerificationVisible, setPinVerificationVisible] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [parentAccessPinVisible, setParentAccessPinVisible] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [parentPinError, setParentPinError] = useState<string | null>(null);

  // Charger les profils et définir le profil actuel
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const profilesData = await ProfileService.getProfiles();
        setProfiles(profilesData);
        
        // Définir le profil actuel
        if (initialProfileId) {
          const profile = profilesData.find(p => p.id === initialProfileId);
          if (profile) {
            setCurrentProfile(profile);
          } else if (profilesData.length > 0) {
            setCurrentProfile(profilesData[0]);
          }
        } else if (profilesData.length > 0) {
          setCurrentProfile(profilesData[0]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [initialProfileId]);

  const handleParentAccess = () => {
    // Afficher la modal de vérification du PIN pour l'accès parent
    setParentAccessPinVisible(true);
  };

  const handleParentAccessSuccess = async (pin: string) => {
    try {
      // Vérifier le code PIN
      const isValid = await PinService.verifyPin(pin);
      
      if (isValid) {
        // Après vérification du PIN, naviguer vers les paramètres
        setParentAccessPinVisible(false);
        setParentPinError(null);
        navigation.navigate('Settings' as any);
      } else {
        setParentPinError("Code PIN incorrect");
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du PIN:', error);
      setParentPinError("Une erreur est survenue");
    }
  };

  const handleParentAccessCancel = () => {
    setParentAccessPinVisible(false);
  };

  const handleProfileAccess = () => {
    // Navigation vers l'écran d'accueil du profil
    if (currentProfile) {
      navigation.navigate('HomeProfile', { profileId: currentProfile.id });
    }
  };

  const toggleProfileSelector = () => {
    setShowProfileSelector(!showProfileSelector);
  };

  const handleProfileSelect = (profileId: string) => {
    // Si c'est le même profil, ne rien faire
    if (currentProfile?.id === profileId) {
      setShowProfileSelector(false);
      return;
    }

    // Sinon, demander la vérification du code PIN
    setSelectedProfileId(profileId);
    setPinVerificationVisible(true);
    setShowProfileSelector(false);
  };

  const handlePinVerificationSuccess = async (pin: string) => {
    try {
      // Vérifier le code PIN
      const isValid = await PinService.verifyPin(pin);
      
      if (isValid) {
        // Changer de profil après vérification du PIN
        if (selectedProfileId) {
          const newProfile = profiles.find(p => p.id === selectedProfileId);
          if (newProfile) {
            setCurrentProfile(newProfile);
          }
        }
        setPinVerificationVisible(false);
        setSelectedProfileId(null);
        setPinError(null);
      } else {
        setPinError("Code PIN incorrect");
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du PIN:', error);
      setPinError("Une erreur est survenue");
    }
  };

  const handlePinVerificationCancel = () => {
    setPinVerificationVisible(false);
    setSelectedProfileId(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography variant="body" style={styles.loadingText}>
            Chargement des profils...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <View style={styles.parentAccessContainer}>
          <TouchableOpacity onPress={handleParentAccess} style={styles.parentAccessButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            <Typography variant="caption" style={styles.parentAccessText}>
              Accès parent
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
      
      <Typography variant="title" center style={styles.headerTitle}>
        Qui est-ce ?
      </Typography>

      <View style={styles.content}>
        {currentProfile ? (
          <>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleProfileAccess}
            >
              <Avatar
                size={120}
                selected={true}
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.profileSelectorButton}
              onPress={toggleProfileSelector}
            >
              <Typography variant="subtitle" center>
                {currentProfile.name}
              </Typography>
              <Ionicons 
                name={showProfileSelector ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={COLORS.text} 
              />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noProfileContainer}>
            <Typography variant="body" center>
              Aucun profil disponible
            </Typography>
            <TouchableOpacity 
              style={styles.createProfileButton}
              onPress={() => navigation.navigate('Settings' as any)}
            >
              <Typography variant="body">
                Créer un profil
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sélecteur de profil */}
      {showProfileSelector && (
        <View style={styles.profileSelectorContainer}>
          <FlatList
            data={profiles}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.profilesList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.profileItem}
                onPress={() => handleProfileSelect(item.id)}
              >
                <Avatar
                  size={60}
                  selected={currentProfile?.id === item.id}
                />
                <Typography 
                  variant="caption" 
                  center
                  style={[
                    styles.profileName,
                    currentProfile?.id === item.id && styles.selectedProfileName
                  ]}
                >
                  {item.name}
                </Typography>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}

      {/* Modal de vérification du code PIN pour changement de profil */}
      {pinVerificationVisible && (
        <Modal
          visible={pinVerificationVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Typography variant="subtitle" center style={styles.modalTitle}>
                Entrez le code PIN pour valider
              </Typography>
              
              <PinInput onComplete={handlePinVerificationSuccess} />
              
              {pinError && (
                <Typography variant="caption" style={styles.errorText}>
                  {pinError}
                </Typography>
              )}
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handlePinVerificationCancel}
                >
                  <Typography variant="body">Annuler</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de vérification du code PIN pour accès parent */}
      {parentAccessPinVisible && (
        <Modal
          visible={parentAccessPinVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Typography variant="subtitle" center style={styles.modalTitle}>
                Entrez le code PIN parental
              </Typography>
              
              <PinInput onComplete={handleParentAccessSuccess} />
              
              {parentPinError && (
                <Typography variant="caption" style={styles.errorText}>
                  {parentPinError}
                </Typography>
              )}
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleParentAccessCancel}
                >
                  <Typography variant="body">Annuler</Typography>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    justifyContent: 'flex-end',
    marginTop: SPACING.xxxl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  placeholder: {
    width: 80,
  },
  parentAccessContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  parentAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  parentAccessText: {
    marginLeft: SPACING.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  avatarContainer: {
    marginBottom: SPACING.xl,
  },
  profileSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  noProfileContainer: {
    alignItems: 'center',
  },
  createProfileButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  profileSelectorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  profilesList: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  profileItem: {
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  profileName: {
    marginTop: SPACING.sm,
  },
  selectedProfileName: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: SPACING.xl,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  modalButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginHorizontal: SPACING.sm,
  },
  cancelButton: {
    backgroundColor: COLORS.cardBackground,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

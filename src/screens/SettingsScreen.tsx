import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Alert, ScrollView, Modal } from 'react-native';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { ProfileItem } from '../components/ProfileItem';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { ProfileService } from '../services/ProfileService';
import { PodcastService } from '../services/PodcastService';
import { Profile } from '../types/profile';
import { StorageUtils } from '../utils/StorageUtils';
import { LoadingScreen } from '../components/LoadingScreen';
import { useToast } from '../contexts/ToastContext';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Charger les profils à chaque fois que l'écran est affiché
  useFocusEffect(
    React.useCallback(() => {
      const loadProfiles = async () => {
        setLoading(true);
        try {
          const profilesData = await ProfileService.getProfiles();
          setProfiles(profilesData);
        } catch (error) {
          console.error('Erreur lors du chargement des profils:', error);
        } finally {
          setLoading(false);
        }
      };

      loadProfiles();

      // Vérifier si on revient d'une création de profil réussie
      const params = navigation.getState().routes.find(r => r.name === 'Settings')?.params;
      if (params) {
        if ('profileCreated' in params && params.profileCreated) {
          showToast('Le profil a bien été créé !', 'success');
          
          // Réinitialiser le paramètre
          navigation.setParams({ profileCreated: undefined });
        } 
        else if ('podcastAdded' in params && params.podcastAdded) {
          showToast('Le podcast a bien été ajouté !', 'success');
          
          // Réinitialiser le paramètre
          navigation.setParams({ podcastAdded: undefined });
        }
        else if ('podcastUpdated' in params && params.podcastUpdated) {
          showToast('Le podcast a bien été mis à jour !', 'success');
          
          // Réinitialiser le paramètre
          navigation.setParams({ podcastUpdated: undefined });
        }
        else if ('podcastDeleted' in params && params.podcastDeleted) {
          showToast('Le podcast a bien été supprimé !', 'success');
          
          // Réinitialiser le paramètre
          navigation.setParams({ podcastDeleted: undefined });
        }
      }
    }, [])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleModifyPin = () => {
    navigation.navigate('ModifyPin');
  };

  const handleAddProfile = () => {
    navigation.navigate('AddProfile');
  };

  const handleAddPodcast = () => {
    navigation.navigate('AddPodcast');
  };

  const handleEditPodcast = () => {
    navigation.navigate('PodcastList');
  };

  const handleEditProfile = (profile: Profile) => {
    // Naviguer vers l'écran de modification de profil
    navigation.navigate('EditProfile', { profileId: profile.id });
  };

  const handleAccessApp = () => {
    // Naviguer vers l'écran de changement de profil
    if (profiles.length > 0) {
      navigation.navigate('ChangeProfile', { initialProfileId: profiles[0].id });
    }
  };

  const handleClearStorage = () => {
    Alert.alert(
      "Vider le stockage",
      "Êtes-vous sûr de vouloir vider tout le stockage ? Cette action effacera tous les profils, podcasts et paramètres. Cette opération est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Vider",
          style: "destructive",
          onPress: async () => {
            try {
              // Afficher l'écran de chargement
              setIsResetting(true);
              
              // Vider le stockage
              await StorageUtils.clearAllStorage();
              
              // Recharger les podcasts depuis la bibliothèque par défaut
              await PodcastService.initializeDefaultPodcasts();
              
              // Masquer l'écran de chargement
              setIsResetting(false);
              
              // Afficher un message de succès
              showToast('Stockage vidé avec succès', 'success');
              
              // Recharger les profils
              setProfiles([]);
              
              // Rediriger vers l'écran de présentation
              navigation.navigate('Presentation');
            } catch (error) {
              console.error('Erreur lors du vidage du stockage:', error);
              setIsResetting(false);
              Alert.alert("Erreur", "Une erreur est survenue lors du vidage du stockage.");
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderSettingItem = (
    title: string, 
    onPress: () => void, 
    isLast: boolean = false,
    isDestructive: boolean = false,
    disabled: boolean = false
  ) => (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        isLast ? styles.lastItem : {},
        disabled ? styles.disabledItem : {}
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Typography 
        variant="body" 
        style={[
          isDestructive ? { color: '#FF3B30' } : {},
          disabled ? { color: 'rgba(255, 255, 255, 0.3)' } : {}
        ]}
      >
        {title}
      </Typography>
      <Ionicons 
        name="chevron-forward" 
        size={24} 
        color={
          isDestructive 
            ? '#FF3B30' 
            : disabled 
              ? 'rgba(255, 255, 255, 0.3)' 
              : COLORS.text
        } 
      />
    </TouchableOpacity>
  );

  const renderProfileItem = ({ item }: { item: Profile }) => (
    <ProfileItem profile={item} onPress={() => handleEditProfile(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {isResetting ? (
        <LoadingScreen message="Réinitialisation de l'application" />
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Typography variant="title" center>Paramètres</Typography>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {profiles.length > 0 && (
                <Button
                  title="Accéder à l'application"
                  onPress={handleAccessApp}
                  fullWidth
                  style={styles.accessAppButton}
                />
              )}
              
              <View style={styles.section}>
                <Typography variant="subtitle" style={styles.sectionTitle}>
                  Gérer les profils
                </Typography>
                
                {profiles.length > 0 ? (
                  <FlatList
                    data={profiles}
                    renderItem={renderProfileItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                ) : (
                  <View style={styles.emptyProfilesContainer}>
                    <Typography variant="body" center style={styles.emptyProfilesText}>
                      Aucun profil créé
                    </Typography>
                  </View>
                )}
                
                {renderSettingItem('Ajouter un profil', handleAddProfile, false, false, profiles.length > 0)}
              </View>

              <View style={styles.section}>
                {renderSettingItem('Modifier le code pin', handleModifyPin)}
              </View>

              <View style={styles.section}>
                {renderSettingItem('Ajouter un podcast', handleAddPodcast)}
                {renderSettingItem('Modifier un podcast', handleEditPodcast)}
              </View>

              <View style={styles.section}>
                {renderSettingItem('Importer/Exporter des paramètres', () => console.log('Importer/Exporter des paramètres'))}
              </View>

              <View style={styles.section}>
                {renderSettingItem('Vider le stockage', handleClearStorage, true, true)}
              </View>
            </View>
          </ScrollView>
        </>
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
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  placeholder: {
    width: 44, // Même taille que le bouton retour pour équilibrer
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  disabledItem: {
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  indicator: {
    width: 100,
    height: 5,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 2.5,
  },
  emptyProfilesContainer: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyProfilesText: {
    opacity: 0.7,
  },
  accessAppButton: {
    marginBottom: SPACING.xl,
  },
});

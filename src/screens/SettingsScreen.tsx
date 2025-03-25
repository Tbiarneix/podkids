import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { Typography } from '../components/Typography';
import { Toast } from '../components/Toast';
import { ProfileItem } from '../components/ProfileItem';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { ProfileService } from '../services/ProfileService';
import { Profile } from '../types/profile';
import { StorageUtils } from '../utils/StorageUtils';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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
          setSuccessMessage('Le profil a bien été créé !');
          setShowSuccessToast(true);
          
          // Réinitialiser le paramètre
          navigation.setParams({ profileCreated: undefined });
        } 
        else if ('podcastAdded' in params && params.podcastAdded) {
          setSuccessMessage('Le podcast a bien été ajouté !');
          setShowSuccessToast(true);
          
          // Réinitialiser le paramètre
          navigation.setParams({ podcastAdded: undefined });
        }
        else if ('podcastUpdated' in params && params.podcastUpdated) {
          setSuccessMessage('Le podcast a bien été mis à jour !');
          setShowSuccessToast(true);
          
          // Réinitialiser le paramètre
          navigation.setParams({ podcastUpdated: undefined });
        }
        else if ('podcastDeleted' in params && params.podcastDeleted) {
          setSuccessMessage('Le podcast a bien été supprimé !');
          setShowSuccessToast(true);
          
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
              await StorageUtils.clearAllStorage();
              setSuccessMessage('Stockage vidé avec succès');
              setShowSuccessToast(true);
              // Recharger les profils
              setProfiles([]);
            } catch (error) {
              console.error('Erreur lors du vidage du stockage:', error);
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
    isDestructive: boolean = false
  ) => (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        isLast ? styles.lastItem : {}
      ]} 
      onPress={onPress}
    >
      <Typography 
        variant="body" 
        style={isDestructive ? { color: '#FF3B30' } : {}}
      >
        {title}
      </Typography>
      <Ionicons name="chevron-forward" size={24} color={isDestructive ? '#FF3B30' : COLORS.text} />
    </TouchableOpacity>
  );

  const renderProfileItem = ({ item }: { item: Profile }) => (
    <ProfileItem profile={item} onPress={() => handleEditProfile(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Toast 
        type="success" 
        message={successMessage} 
        visible={showSuccessToast} 
        onHide={() => setShowSuccessToast(false)} 
      />
      
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
            
            {renderSettingItem('Ajouter un profil', handleAddProfile)}
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

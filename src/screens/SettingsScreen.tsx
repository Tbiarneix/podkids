import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
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

  const renderSettingItem = (
    title: string, 
    onPress: () => void, 
    isLast: boolean = false
  ) => (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        isLast ? styles.lastItem : {}
      ]} 
      onPress={onPress}
    >
      <Typography variant="body">{title}</Typography>
      <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
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
          {renderSettingItem('Modifier les code pin', handleModifyPin)}
        </View>

        <View style={styles.section}>
          {renderSettingItem('Ajouter un podcast', handleAddPodcast)}
        </View>

        <View style={styles.section}>
          {renderSettingItem('Importer des paramètres', () => console.log('Importer des paramètres'))}
        </View>

        <View style={styles.section}>
          {renderSettingItem('Exporter les paramètres', () => console.log('Exporter les paramètres'), true)}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.indicator} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: SPACING.xxxl,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
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

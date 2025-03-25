import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type PodcastErrorScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PodcastError'
>;

type PodcastErrorScreenRouteProp = RouteProp<
  RootStackParamList,
  'PodcastError'
>;

export const PodcastErrorScreen: React.FC = () => {
  const navigation = useNavigation<PodcastErrorScreenNavigationProp>();
  const route = useRoute<PodcastErrorScreenRouteProp>();
  
  // Récupérer les paramètres de l'erreur
  const { errorType, errorMessage } = route.params || {
    errorType: 'generic',
    errorMessage: 'Une erreur est survenue lors de l\'ajout du podcast.'
  };

  // Définir le titre et le message en fonction du type d'erreur
  let title = 'Erreur';
  let message = errorMessage;

  switch (errorType) {
    case 'invalid_url':
      title = 'URL invalide';
      message = message || "L'URL du podcast n'est pas valide ou ne pointe pas vers un flux RSS.";
      break;
    case 'fetch_error':
      title = 'Erreur de connexion';
      message = message || "Impossible de se connecter au flux du podcast. Vérifiez votre connexion internet.";
      break;
    case 'parse_error':
      title = 'Format non reconnu';
      message = message || "Le format du flux n'est pas reconnu. Assurez-vous qu'il s'agit bien d'un flux de podcast.";
      break;
    case 'already_exists':
      title = 'Podcast déjà ajouté';
      message = message || "Ce podcast a déjà été ajouté à votre bibliothèque.";
      break;
    default:
      // Utiliser les valeurs par défaut
      break;
  }

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRetry = () => {
    // Retourner à l'écran d'ajout de podcast
    navigation.navigate('AddPodcast');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center>{title}</Typography>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle" size={80} color={COLORS.error} />
        </View>
        
        <Typography variant="subtitle" center style={styles.errorTitle}>
          {title}
        </Typography>
        
        <Typography variant="body" center style={styles.errorMessage}>
          {message}
        </Typography>

        <Button
          title="Réessayer"
          onPress={handleRetry}
          fullWidth
          variant="outline"
          style={[styles.retryButton, { borderColor: COLORS.primary, borderWidth: 1, backgroundColor: 'transparent' }]}
        />
        
        <Button
          title="Retour aux paramètres"
          onPress={handleBack}
          fullWidth
          variant="primary"
          style={styles.backToSettingsButton}
        />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconContainer: {
    marginBottom: SPACING.xl,
  },
  errorTitle: {
    marginBottom: SPACING.md,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    color: COLORS.textSecondary,
  },
  retryButton: {
    marginBottom: SPACING.md,
  },
  backToSettingsButton: {
    marginBottom: SPACING.xl,
  },
});

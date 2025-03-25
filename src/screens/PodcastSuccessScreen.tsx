import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

type PodcastSuccessScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PodcastSuccess'
>;

type PodcastSuccessScreenRouteProp = RouteProp<
  RootStackParamList,
  'PodcastSuccess'
>;

export const PodcastSuccessScreen: React.FC = () => {
  const navigation = useNavigation<PodcastSuccessScreenNavigationProp>();
  const route = useRoute<PodcastSuccessScreenRouteProp>();
  
  // Récupérer le nom du podcast depuis les paramètres de route
  const { podcastName } = route.params || {
    podcastName: 'Le podcast'
  };

  // Animation pour l'icône de succès
  const scaleAnim = new Animated.Value(0);
  
  useEffect(() => {
    // Animer l'icône de succès
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
    
    // Retourner automatiquement à l'écran des paramètres après 3 secondes
    const timer = setTimeout(() => {
      handleBackToSettings();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleBackToSettings = () => {
    // Naviguer vers l'écran des paramètres avec un paramètre indiquant le succès
    navigation.navigate('Settings', { podcastAdded: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.successIconContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={60} color={COLORS.background} />
          </View>
        </Animated.View>
        
        <Typography variant="title" center style={styles.successTitle}>
          Podcast ajouté !
        </Typography>
        
        <Typography variant="body" center style={styles.successMessage}>
          {`${podcastName} a été ajouté avec succès à votre bibliothèque.`}
        </Typography>

        <Button
          title="Retour aux paramètres"
          onPress={handleBackToSettings}
          fullWidth
          style={styles.backButton}
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: SPACING.xl,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    marginBottom: SPACING.md,
  },
  successMessage: {
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    color: COLORS.textSecondary,
  },
  backButton: {
    marginBottom: SPACING.xl,
  },
});

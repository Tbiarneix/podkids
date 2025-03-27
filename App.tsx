import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { 
  useFonts, 
  Rubik_400Regular, 
  Rubik_500Medium, 
  Rubik_700Bold 
} from '@expo-google-fonts/rubik';
import { PresentationScreen } from './src/screens/PresentationScreen';
import { PinCodeScreen } from './src/screens/PinCodeScreen';
import { PinVerificationScreen } from './src/screens/PinVerificationScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ModifyPinScreen } from './src/screens/ModifyPinScreen';
import { AddProfileScreen } from './src/screens/AddProfileScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { ChangeProfileScreen } from './src/screens/ChangeProfileScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { AddPodcastScreen } from './src/screens/AddPodcastScreen';
import { PodcastErrorScreen } from './src/screens/PodcastErrorScreen';
import { PodcastSuccessScreen } from './src/screens/PodcastSuccessScreen';
import { HomeProfileScreen } from './src/screens/HomeProfileScreen';
import { ThemePodcastsScreen } from './src/screens/ThemePodcastsScreen';
import { PodcastListScreen } from './src/screens/PodcastListScreen';
import { EditPodcastScreen } from './src/screens/EditPodcastScreen';
import { PodcastDetailsScreen } from './src/screens/PodcastDetailsScreen';
import { EpisodeDetailsScreen } from './src/screens/EpisodeDetailsScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { PlaylistScreen } from './src/screens/PlaylistScreen';
import { PlaylistDetailsScreen } from './src/screens/PlaylistDetailsScreen';
import { COLORS } from './src/utils/theme';
import { RootStackParamList } from './src/types/navigation';
import { ProfileService } from './src/services/ProfileService';
import { PinService } from './src/services/PinService';
import { PodcastService } from './src/services/PodcastService';
import { PlayerProvider } from './src/contexts/PlayerContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { PlayerBar } from './src/components/PlayerBar';
import { usePlayer } from './src/contexts/PlayerContext';
import { LoadingScreen } from './src/components/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainApp() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
  });

  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Presentation');
  const [initialParams, setInitialParams] = useState<any>(undefined);
  
  const { currentEpisode, currentPodcast, isPlayerVisible, closePlayer } = usePlayer();

  // Déterminer l'écran initial en fonction de l'état de l'application
  useEffect(() => {
    const checkAppState = async () => {
      try {
        // Initialiser la bibliothèque de podcasts par défaut si nécessaire
        await PodcastService.initializeDefaultPodcasts();
        
        // Vérifier si un code PIN est configuré
        const isPinConfigured = await PinService.isPinConfigured();
        
        // Vérifier s'il existe des profils
        const profiles = await ProfileService.getProfiles();
        
        if (!isPinConfigured) {
          // Si pas de PIN configuré, aller à l'écran de présentation
          setInitialRoute('Presentation');
        } else if (profiles.length > 0) {
          // Si des profils existent, aller à l'écran de changement de profil
          setInitialRoute('ChangeProfile');
          setInitialParams({ initialProfileId: profiles[0].id });
        } else {
          // Sinon, aller aux paramètres pour créer un profil
          setInitialRoute('Settings');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'état de l\'application:', error);
        // En cas d'erreur, aller à l'écran de présentation par défaut
        setInitialRoute('Presentation');
      } finally {
        setInitializing(false);
      }
    };

    checkAppState();
  }, []);

  // Définir la hauteur du PlayerBar pour la marge
  const playerBarHeight = 70; // Hauteur du PlayerBar en pixels

  if (!fontsLoaded || initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: COLORS.background,
            // Ajouter une marge en bas lorsque le PlayerBar est visible
            paddingBottom: isPlayerVisible ? playerBarHeight : 0,
          },
        }}
      >
        <Stack.Screen 
          name="Presentation" 
          component={PresentationScreen} 
        />
        <Stack.Screen 
          name="PinCode" 
          component={PinCodeScreen} 
        />
        <Stack.Screen 
          name="PinVerification" 
          component={PinVerificationScreen} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
        />
        <Stack.Screen 
          name="ModifyPin" 
          component={ModifyPinScreen} 
        />
        <Stack.Screen 
          name="AddProfile" 
          component={AddProfileScreen} 
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen} 
        />
        <Stack.Screen 
          name="ChangeProfile" 
          component={ChangeProfileScreen}
          initialParams={initialRoute === 'ChangeProfile' ? initialParams : undefined}
        />
        <Stack.Screen 
          name="Notification" 
          component={NotificationScreen} 
        />
        <Stack.Screen 
          name="AddPodcast" 
          component={AddPodcastScreen} 
        />
        <Stack.Screen 
          name="PodcastError" 
          component={PodcastErrorScreen} 
        />
        <Stack.Screen 
          name="PodcastSuccess" 
          component={PodcastSuccessScreen} 
        />
        <Stack.Screen 
          name="HomeProfile" 
          component={HomeProfileScreen} 
        />
        <Stack.Screen 
          name="Home" 
          component={HomeProfileScreen} 
        />
        <Stack.Screen 
          name="ThemePodcasts" 
          component={ThemePodcastsScreen} 
        />
        <Stack.Screen 
          name="PodcastList" 
          component={PodcastListScreen} 
        />
        <Stack.Screen 
          name="EditPodcast" 
          component={EditPodcastScreen} 
        />
        <Stack.Screen 
          name="PodcastDetails" 
          component={PodcastDetailsScreen} 
        />
        <Stack.Screen 
          name="EpisodeDetails" 
          component={EpisodeDetailsScreen} 
        />
        <Stack.Screen 
          name="Library" 
          component={LibraryScreen} 
        />
        <Stack.Screen 
          name="Playlists" 
          component={PlaylistScreen} 
        />
        <Stack.Screen 
          name="PlaylistDetails" 
          component={PlaylistDetailsScreen} 
        />
      </Stack.Navigator>
      
      {isPlayerVisible && currentEpisode && currentPodcast && (
        <PlayerBar 
          episode={currentEpisode} 
          podcast={currentPodcast} 
          onClose={closePlayer} 
        />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    fontFamily: 'Rubik_700Bold',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Rubik_400Regular',
  },
});

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Text } from 'react-native';
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
import { COLORS } from './src/utils/theme';
import { RootStackParamList } from './src/types/navigation';
import { ProfileService } from './src/services/ProfileService';
import { PinService } from './src/services/PinService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
  });

  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Presentation');
  const [initialParams, setInitialParams] = useState<any>(undefined);

  // Déterminer l'écran initial en fonction de l'état de l'application
  useEffect(() => {
    const checkAppState = async () => {
      try {
        // Vérifier si un code PIN est configuré
        const isPinConfigured = await PinService.isPinConfigured();
        
        // Vérifier s'il existe des profils
        const profiles = await ProfileService.getProfiles();
        
        if (!isPinConfigured) {
          // Si pas de PIN configuré, aller à l'écran de configuration du PIN
          setInitialRoute('PinCode');
        } else if (profiles.length > 0) {
          // Si des profils existent, aller à l'écran de changement de profil
          setInitialRoute('ChangeProfile');
          setInitialParams({ initialProfileId: profiles[0].id });
        } else {
          // Sinon, aller à l'écran de présentation
          setInitialRoute('Presentation');
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

  if (!fontsLoaded || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 18,
  },
});

import React from 'react';
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
import { NotificationScreen } from './src/screens/NotificationScreen';
import { COLORS } from './src/utils/theme';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
        <Text style={styles.logoText}>podKids</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Presentation"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="Presentation" component={PresentationScreen} />
        <Stack.Screen name="PinCode" component={PinCodeScreen} />
        <Stack.Screen name="PinVerification" component={PinVerificationScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ModifyPin" component={ModifyPinScreen} />
        <Stack.Screen name="AddProfile" component={AddProfileScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  logoText: {
    marginTop: 20,
    fontSize: 24,
    fontFamily: 'Rubik_700Bold',
    color: '#FFFFFF',
  },
});

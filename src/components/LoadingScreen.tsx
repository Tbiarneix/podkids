import React from 'react';
import { View, StyleSheet, Image, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../utils/theme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Initialisation de l\'application' 
}) => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo.webp')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.appName}>podKids</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

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

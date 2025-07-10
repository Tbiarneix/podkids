import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Text, Animated, Easing } from 'react-native';
import { COLORS } from '../utils/theme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  // Animation pour le logo (scale)  
  const logoScale = useRef(new Animated.Value(0.5)).current;
  // Animation pour le texte (opacity)
  const textOpacity = useRef(new Animated.Value(0)).current;
  // Animation pour le pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation séquentielle
    Animated.sequence([
      // Faire apparaître le logo
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      // Faire apparaître le texte
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();

    // Animation de pulsation en boucle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    ).start();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <Animated.Image 
          source={require('../../assets/logo.png')} 
          style={[styles.logo, { 
            transform: [
              { scale: logoScale },
              { scale: pulseAnim }
            ] 
          }]} 
          resizeMode="contain"
        />
        <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
          podKids
        </Animated.Text>
        {message && (
          <Animated.Text style={[styles.message, { opacity: textOpacity }]}>
            {message}
          </Animated.Text>
        )}
      </View>
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
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
    fontFamily: 'Rubik_700Bold',
  },
  message: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 20,
    textAlign: 'center',
  },
});

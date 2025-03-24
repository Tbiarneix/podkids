import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Typography } from '../components/Typography';
import { PinInput } from '../components/PinInput';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { PinService } from '../services/PinService';

type PinVerificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PinVerification'
>;

export const PinVerificationScreen: React.FC = () => {
  const navigation = useNavigation<PinVerificationScreenNavigationProp>();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinChange = (value: string) => {
    setPin(value);
    setError('');
    
    // Vérifier automatiquement le PIN lorsqu'il atteint 5 chiffres
    if (value.length === 5) {
      verifyPin(value);
    }
  };

  const verifyPin = async (pinToVerify: string) => {
    try {
      const isPinCorrect = await PinService.verifyPin(pinToVerify);
      
      if (isPinCorrect) {
        // PIN correct, naviguer vers l'écran des paramètres
        navigation.navigate('Settings');
      } else {
        setError('Code PIN incorrect');
        setPin('');
      }
    } catch (e) {
      console.error('Erreur lors de la vérification du PIN:', e);
      setError('Erreur lors de la vérification. Veuillez réessayer.');
      setPin('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="title" center>
          Entrez le code PIN
        </Typography>
        
        <PinInput
          length={5}
          value={pin}
          onChange={handlePinChange}
        />
        
        {error ? (
          <Typography 
            variant="caption" 
            color={COLORS.error} 
            center
            style={styles.errorText}
          >
            {error}
          </Typography>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  errorText: {
    marginTop: SPACING.md,
  },
});

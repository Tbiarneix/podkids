import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { PinInput } from '../components/PinInput';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { PinService } from '../services/PinService';

type PinCodeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PinCode'
>;

export const PinCodeScreen: React.FC = () => {
  const navigation = useNavigation<PinCodeScreenNavigationProp>();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');

  const handlePinChange = (value: string) => {
    setPin(value);
    setError('');
  };

  const handleConfirmPinChange = (value: string) => {
    setConfirmPin(value);
    setError('');
  };

  const handleNext = async () => {
    if (step === 'create') {
      if (pin.length === 5) {
        setStep('confirm');
      } else {
        setError('Veuillez entrer un code PIN à 5 chiffres');
      }
    } else {
      if (confirmPin.length === 5) {
        if (pin === confirmPin) {
          try {
            // Stocker le PIN avec notre service
            await PinService.storePin(pin);
            
            // Naviguer directement vers l'écran des paramètres au lieu de l'écran de vérification
            navigation.navigate('Settings', {});
          } catch (e) {
            console.error('Erreur lors du stockage du PIN:', e);
            setError('Erreur lors de la création du PIN. Veuillez réessayer.');
          }
        } else {
          setError('Les codes PIN ne correspondent pas');
          setConfirmPin('');
        }
      } else {
        setError('Veuillez confirmer votre code PIN');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant="title" center>
          {step === 'create' 
            ? 'Définissez votre code pin' 
            : 'Confirmez votre code PIN'}
        </Typography>
        
        {step === 'create' ? (
          <PinInput
            length={5}
            value={pin}
            onChange={handlePinChange}
          />
        ) : (
          <>
            <PinInput
              length={5}
              value={confirmPin}
              onChange={handleConfirmPinChange}
            />
          </>
        )}
        
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
      
      <View style={styles.footer}>
        {step === 'confirm' && (
          <Button 
            title="Créer" 
            onPress={handleNext}
            fullWidth
          />
        )}
        
        {step === 'create' && pin.length === 5 && (
          <Button 
            title="Suivant" 
            onPress={handleNext}
            fullWidth
          />
        )}
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
  footer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xl * 1.5,
  },
});

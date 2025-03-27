import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { PinInput, PinInputRef } from '../components/PinInput';
import { useToast } from '../contexts/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { PinService } from '../services/PinService';

export const ModifyPinScreen: React.FC = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'old' | 'new' | 'confirm'>('old');
  
  // Références pour les champs de saisie
  const oldPinRef = useRef<PinInputRef>(null);
  const newPinRef = useRef<PinInputRef>(null);
  const confirmPinRef = useRef<PinInputRef>(null);

  // Effet pour gérer le focus automatique lors du changement d'étape
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (step === 'old' && oldPinRef.current) {
        oldPinRef.current.focus();
      } else if (step === 'new' && newPinRef.current) {
        newPinRef.current.focus();
      } else if (step === 'confirm' && confirmPinRef.current) {
        confirmPinRef.current.focus();
      }
    }, 300);
    
    return () => clearTimeout(focusTimer);
  }, [step]);

  const handleBack = () => {
    if (step === 'new') {
      setStep('old');
      return;
    }
    if (step === 'confirm') {
      setStep('new');
      return;
    }
    navigation.goBack();
  };

  const handleOldPinChange = (value: string) => {
    setOldPin(value);
  };

  const handleNewPinChange = (value: string) => {
    setNewPin(value);
  };

  const handleConfirmPinChange = (value: string) => {
    setConfirmPin(value);
  };

  const verifyOldPin = async () => {
    if (oldPin.length !== 5) {
      showToast('Veuillez entrer un code PIN à 5 chiffres', 'error');
      return;
    }

    try {
      const isPinCorrect = await PinService.verifyPin(oldPin);
      
      if (isPinCorrect) {
        // PIN correct, passer à l'étape suivante
        setStep('new');
      } else {
        showToast('Le code PIN actuel est incorrect', 'error');
        setOldPin('');
      }
    } catch (e) {
      console.error('Erreur lors de la vérification du PIN:', e);
      showToast('Erreur lors de la vérification. Veuillez réessayer.', 'error');
      setOldPin('');
    }
  };

  const handleNextToConfirm = () => {
    if (newPin.length !== 5) {
      showToast('Veuillez entrer un code PIN à 5 chiffres', 'error');
      return;
    }
    setStep('confirm');
  };

  const handleSave = async () => {
    if (confirmPin.length !== 5) {
      showToast('Veuillez confirmer votre code PIN', 'error');
      return;
    }
    
    if (newPin !== confirmPin) {
      showToast('Les codes PIN ne correspondent pas !', 'error');
      setConfirmPin('');
      return;
    }
    
    try {
      // Stocker le nouveau PIN
      await PinService.storePin(newPin);
      
      // Afficher le toast de succès
      showToast('Le code PIN a bien été mis à jour !', 'success');
      
      // Retourner à l'écran précédent après un délai
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (e) {
      console.error('Erreur lors du stockage du PIN:', e);
      showToast('Erreur lors de la mise à jour du PIN. Veuillez réessayer.', 'error');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'old':
        return (
          <View style={styles.stepContent}>
            <Typography variant="body" center style={styles.pinLabel}>
              Entrez votre ancien code pin
            </Typography>
            <PinInput
              length={5}
              value={oldPin}
              onChange={handleOldPinChange}
              ref={oldPinRef}
            />
            <Button 
              title="Suivant" 
              onPress={verifyOldPin}
              fullWidth
              style={styles.nextButton}
            />
          </View>
        );
      case 'new':
        return (
          <View style={styles.stepContent}>
            <Typography variant="body" center style={styles.pinLabel}>
              Entrez votre nouveau code PIN
            </Typography>
            <PinInput
              length={5}
              value={newPin}
              onChange={handleNewPinChange}
              ref={newPinRef}
            />
            <Button 
              title="Suivant" 
              onPress={handleNextToConfirm}
              fullWidth
              style={styles.nextButton}
            />
          </View>
        );
      case 'confirm':
        return (
          <View style={styles.stepContent}>
            <Typography variant="body" center style={styles.pinLabel}>
              Confirmez votre nouveau code PIN
            </Typography>
            <PinInput
              length={5}
              value={confirmPin}
              onChange={handleConfirmPinChange}
              ref={confirmPinRef}
            />
            <Button 
              title="Enregistrer" 
              onPress={handleSave}
              fullWidth
              style={styles.nextButton}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center style={styles.headerTitle}>
          Modifier votre code pin
        </Typography>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  placeholder: {
    width: 24,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  stepContent: {
    width: '100%',
    alignItems: 'center',
  },
  pinLabel: {
    marginBottom: SPACING.md,
  },
  nextButton: {
    marginTop: SPACING.xl,
  },
});

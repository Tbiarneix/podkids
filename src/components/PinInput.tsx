import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  Keyboard
} from 'react-native';
import { COLORS, SPACING } from '../utils/theme';

interface PinInputProps {
  length?: number;
  onComplete?: (pin: string) => void;
}

export const PinInput: React.FC<PinInputProps> = ({ 
  length = 5, 
  onComplete 
}) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Initialiser les refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Gérer la saisie d'un chiffre
  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.charAt(text.length - 1);
    }

    // Vérifier que c'est un chiffre
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    // Focus sur l'input suivant
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Vérifier si le code PIN est complet
    if (text && index === length - 1) {
      const completePin = [...newPin].join('');
      Keyboard.dismiss();
      onComplete && onComplete(completePin);
    }
  };

  // Gérer la suppression
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Réinitialiser le PIN
  const resetPin = () => {
    setPin(Array(length).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
      {Array(length).fill(0).map((_, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.inputContainer}
          onPress={() => inputRefs.current[index]?.focus()}
        >
          <TextInput
            ref={ref => inputRefs.current[index] = ref}
            style={styles.input}
            keyboardType="numeric"
            maxLength={1}
            value={pin[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            secureTextEntry={true}
            selectTextOnFocus={true}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  inputContainer: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginHorizontal: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    color: COLORS.text,
  },
});

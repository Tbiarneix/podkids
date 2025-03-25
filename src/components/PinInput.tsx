import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (pin: string) => void;
}

export interface PinInputRef {
  focus: () => void;
  reset: () => void;
}

export const PinInput = forwardRef<PinInputRef, PinInputProps>(({ 
  length = 5, 
  value = '',
  onChange,
  onComplete 
}, ref) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Exposer les méthodes via la ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRefs.current[0]?.focus();
    },
    reset: () => {
      resetPin();
    }
  }));

  // Initialiser les refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Mettre à jour le PIN interne lorsque la valeur externe change
  useEffect(() => {
    if (value === '') {
      setPin(Array(length).fill(''));
    } else {
      const valueArray = value.split('').concat(Array(length).fill('')).slice(0, length);
      setPin(valueArray);
    }
  }, [value, length]);

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

    // Mettre à jour la valeur externe
    const newValue = newPin.join('');
    onChange && onChange(newValue);

    // Focus sur l'input suivant
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Vérifier si le code PIN est complet
    if (text && index === length - 1) {
      const completePin = newPin.join('');
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
      
      // Mettre à jour la valeur externe
      const newValue = newPin.join('');
      onChange && onChange(newValue);
      
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Réinitialiser le PIN
  const resetPin = () => {
    setPin(Array(length).fill(''));
    onChange && onChange('');
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
});

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

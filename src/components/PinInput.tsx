import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, TextInput, Keyboard, Platform } from 'react-native';
import { COLORS, SPACING } from '../utils/theme';

interface PinInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
}

export interface PinInputRef {
  focus: () => void;
  blur: () => void;
}

export const PinInput = forwardRef<PinInputRef, PinInputProps>(({ 
  length = 5, 
  value, 
  onChange 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Créer un tableau de la longueur spécifiée
  const codeArray = value.split('');
  const filledBoxes = codeArray.length;
  
  // Référence à l'input caché
  const inputRef = React.useRef<TextInput>(null);

  // Exposer les méthodes focus et blur via la référence
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        
        // Sur Android, on peut avoir besoin de forcer l'affichage du clavier
        if (Platform.OS === 'android') {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
      }
    },
    blur: () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }));

  // Focus sur l'input quand le composant est monté
  useEffect(() => {
    // Petit délai pour s'assurer que le composant est bien monté
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        
        // Sur Android, on peut avoir besoin de forcer l'affichage du clavier
        if (Platform.OS === 'android') {
          inputRef.current.blur();
          inputRef.current.focus();
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      
      // Sur Android, on peut avoir besoin de forcer l'affichage du clavier
      if (Platform.OS === 'android') {
        Keyboard.dismiss();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChangeText = (text: string) => {
    // Filtrer pour ne garder que les chiffres
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Limiter à la longueur maximale
    const truncatedText = numericText.slice(0, length);
    
    // Mettre à jour la valeur
    onChange(truncatedText);
  };

  return (
    <View style={styles.container}>
      <View style={styles.boxesContainer}>
        {[...Array(length)].map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.box, 
              index < filledBoxes && styles.filledBox,
              isFocused && index === filledBoxes && styles.focusedBox
            ]}
          >
            {index < filledBoxes && (
              <View style={styles.dot} />
            )}
          </View>
        ))}
      </View>
      
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="numeric"
        maxLength={length}
        onFocus={handleFocus}
        onBlur={handleBlur}
        caretHidden
        autoFocus
      />
      
      {/* Zone tactile pour faciliter la mise au point de l'input caché */}
      <View style={styles.touchArea} onTouchStart={handlePress} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
  },
  box: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  focusedBox: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 50,  // Augmenter la hauteur pour faciliter le focus
    width: '100%',
    bottom: 0,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

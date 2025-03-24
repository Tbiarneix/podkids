import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../utils/theme';

interface ToastProps {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
  onHide?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  visible,
  onHide,
  duration = 3000
}) => {
  const [animation] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible && !isVisible) {
      // Afficher le toast
      setIsVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();

      // Configurer le timer pour masquer automatiquement le toast
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else if (!visible && isVisible) {
      // Masquer le toast quand visible passe à false
      hideToast();
    }
  }, [visible, isVisible]);

  const hideToast = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setIsVisible(false);
      if (onHide) onHide();
    });
  };

  if (!isVisible) return null;

  const backgroundColor = type === 'success' ? COLORS.primary : COLORS.error;
  const iconName = type === 'success' ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0]
              })
            }
          ]
        }
      ]}
    >
      <Ionicons name={iconName} size={24} color={type === 'success' ? '#000' : '#FFF'} />
      <Text style={[styles.message, { color: type === 'success' ? '#000' : '#FFF' }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginLeft: SPACING.sm,
    fontFamily: FONTS.medium,
    fontSize: 16,
  }
});

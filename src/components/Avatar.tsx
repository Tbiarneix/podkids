import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../utils/theme';

interface AvatarProps {
  selected?: boolean;
  onPress?: () => void;
  size?: number;
  disabled?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  selected = false, 
  onPress, 
  size = 60,
  disabled = false
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || !onPress}
      style={[
        styles.container, 
        { 
          width: size, 
          height: size,
          borderColor: selected ? COLORS.primary : 'transparent',
        }
      ]}
    >
      <Image 
        source={require('../../assets/avatar.png')} 
        style={{ width: size - 8, height: size - 8 }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
});

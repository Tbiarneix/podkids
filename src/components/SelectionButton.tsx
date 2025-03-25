import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../utils/theme';

interface SelectionButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  customStyle?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export const SelectionButton: React.FC<SelectionButtonProps> = ({ 
  label, 
  description,
  selected, 
  onPress,
  size = 'small',
  customStyle,
  fullWidth = false
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[size],
        customStyle,
        fullWidth && styles.fullWidth,
        { backgroundColor: selected ? COLORS.primary : COLORS.background }
      ]}
      onPress={onPress}
    >
      <Text 
        style={[
          styles.label,
          { color: selected ? '#000' : COLORS.text }
        ]}
      >
        {label}
      </Text>
      {description && (
        <Text 
          style={[
            styles.description,
            { color: selected ? '#000' : COLORS.textSecondary }
          ]}
        >
          {description}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  medium: {
    width: 100,
    height: 100,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  large: {
    width: 120,
    height: 120,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  fullWidth: {
    width: '100%',
    marginRight: 0,
    paddingVertical: SPACING.lg,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

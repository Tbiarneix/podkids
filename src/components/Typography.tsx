import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme';

interface TypographyProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  color?: string;
  center?: boolean;
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = COLORS.text,
  center = false,
  style,
  children,
  ...props
}) => {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color },
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: FONTS.regular,
  },
  title: {
    fontSize: SIZES.title,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  body: {
    fontSize: SIZES.md,
    lineHeight: 24,
  },
  caption: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  center: {
    textAlign: 'center',
  },
});

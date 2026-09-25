import React from 'react';
import { StyleSheet, View, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'active' | 'subtle' | 'elevated';
  onPress?: () => void;
  disabled?: boolean;
  glow?: 'none' | 'teal' | 'blue';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  disabled = false,
  glow = 'none',
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'active':
        return styles.cardActive;
      case 'subtle':
        return styles.cardSubtle;
      case 'elevated':
        return styles.cardElevated;
      default:
        return styles.cardDefault;
    }
  };

  const getGlowStyle = () => {
    if (glow === 'teal') return shadows.glowTeal;
    if (glow === 'blue') return shadows.glowBlue;
    return shadows.subtleCard;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        disabled={disabled}
        style={[styles.base, getVariantStyle(), getGlowStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), getGlowStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: colors.glassBackground,
    borderColor: colors.glassBorder,
  },
  cardActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderColor: colors.glassBorderActive,
  },
  cardSubtle: {
    backgroundColor: colors.glassBackgroundSubtle,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardElevated: {
    backgroundColor: colors.glassBackgroundHover,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
});

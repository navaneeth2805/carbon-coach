import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export interface CO2eBadgeProps {
  value: number; // in kg CO2e
  size?: 'hero' | 'lg' | 'md' | 'sm';
  showRatingColor?: boolean;
  style?: StyleProp<ViewStyle>;
  prefix?: string;
}

export const CO2eBadge: React.FC<CO2eBadgeProps> = ({
  value,
  size = 'md',
  showRatingColor = true,
  style,
  prefix,
}) => {
  const formattedValue = value >= 10 ? value.toFixed(1) : value.toFixed(2);

  const getImpactColor = () => {
    if (!showRatingColor) return colors.primaryTeal;
    if (value <= 1.0) return colors.impactLow;
    if (value <= 2.5) return colors.impactModerate;
    return colors.impactHigh;
  };

  const impactColor = getImpactColor();

  if (size === 'hero') {
    return (
      <View style={[styles.heroContainer, style]}>
        <View style={styles.numberRow}>
          {prefix ? <Text style={[styles.heroPrefix, { color: impactColor }]}>{prefix}</Text> : null}
          <Text style={[styles.heroText, { color: impactColor }]}>{formattedValue}</Text>
          <Text style={styles.heroUnit}>kg</Text>
        </View>
        <Text style={styles.heroSubLabel}>CO₂e emissions</Text>
      </View>
    );
  }

  if (size === 'lg') {
    return (
      <View style={[styles.lgContainer, style]}>
        <View style={styles.numberRow}>
          {prefix ? <Text style={[styles.lgPrefix, { color: impactColor }]}>{prefix}</Text> : null}
          <Text style={[styles.lgText, { color: impactColor }]}>{formattedValue}</Text>
          <Text style={styles.lgUnit}>kg CO₂e</Text>
        </View>
      </View>
    );
  }

  if (size === 'sm') {
    return (
      <View
        style={[
          styles.smContainer,
          { borderColor: impactColor, backgroundColor: `${impactColor}15` },
          style,
        ]}
      >
        <Text style={[styles.smText, { color: impactColor }]}>
          {prefix || ''}{formattedValue} kg CO₂e
        </Text>
      </View>
    );
  }

  // Default 'md'
  return (
    <View
      style={[
        styles.mdContainer,
        { borderColor: impactColor, backgroundColor: `${impactColor}18` },
        style,
      ]}
    >
      <Text style={[styles.mdText, { color: impactColor }]}>
        {prefix || ''}{formattedValue}{' '}
        <Text style={styles.mdUnit}>kg CO₂e</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroPrefix: {
    fontSize: 28,
    fontWeight: typography.weights.heavy,
    marginRight: 2,
  },
  heroText: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.heavy,
    letterSpacing: typography.letterSpacing.tight,
  },
  heroUnit: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  heroSubLabel: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  lgContainer: {
    alignItems: 'flex-start',
  },
  lgPrefix: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    marginRight: 2,
  },
  lgText: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.heavy,
  },
  lgUnit: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  mdContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  mdText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
  },
  mdUnit: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  smContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  smText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },
});

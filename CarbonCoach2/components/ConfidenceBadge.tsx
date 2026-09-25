import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export type ConfidenceType =
  | 'agreement'
  | 'disagreement'
  | 'gemini_only'
  | 'custom_only'
  | 'manual';

export interface ConfidenceBadgeProps {
  type: ConfidenceType;
  confidence?: number; // 0 to 1
  style?: StyleProp<ViewStyle>;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  type,
  confidence,
  style,
}) => {
  const getBadgeDetails = () => {
    switch (type) {
      case 'agreement':
        return {
          icon: 'checkmark-circle-outline' as const,
          label: '✓ Gemini + Custom Model Agree',
          borderColor: colors.success,
          bgColor: 'rgba(16, 185, 129, 0.15)',
          textColor: colors.success,
        };
      case 'disagreement':
        return {
          icon: 'alert-circle-outline' as const,
          label: 'Detectors Disagree (Comparing Models)',
          borderColor: colors.warning,
          bgColor: 'rgba(245, 158, 11, 0.15)',
          textColor: colors.warning,
        };
      case 'gemini_only':
        return {
          icon: 'sparkles-outline' as const,
          label: 'Gemini Vision AI',
          borderColor: colors.primaryTeal,
          bgColor: 'rgba(45, 212, 191, 0.12)',
          textColor: colors.primaryTeal,
        };
      case 'custom_only':
        return {
          icon: 'hardware-chip-outline' as const,
          label: 'Custom FastAPI Model',
          borderColor: colors.electricBlue,
          bgColor: 'rgba(59, 130, 246, 0.12)',
          textColor: colors.electricBlue,
        };
      case 'manual':
        return {
          icon: 'create-outline' as const,
          label: 'Manually Logged',
          borderColor: colors.textSecondary,
          bgColor: 'rgba(148, 163, 184, 0.12)',
          textColor: colors.textSecondary,
        };
    }
  };

  const details = getBadgeDetails();
  const confidencePercent = confidence ? ` (${Math.round(confidence * 100)}%)` : '';

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: details.borderColor,
          backgroundColor: details.bgColor,
        },
        style,
      ]}
    >
      <Ionicons name={details.icon} size={15} color={details.textColor} style={styles.icon} />
      <Text style={[styles.text, { color: details.textColor }]}>
        {details.label}{confidencePercent}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
  },
});

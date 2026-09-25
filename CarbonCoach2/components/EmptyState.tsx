import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'leaf-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <View style={[styles.iconCircle, compact && styles.compactIconCircle]}>
        <Ionicons
          name={icon}
          size={compact ? 24 : 36}
          color={colors.primaryTeal}
        />
      </View>
      <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, compact && styles.compactDescription]}>
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAction}
          style={styles.actionButton}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textInverse} style={styles.actionIcon} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: colors.glassBackgroundSubtle,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  compactContainer: {
    padding: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.25)',
  },
  compactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  compactTitle: {
    fontSize: typography.sizes.body,
  },
  description: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeights.callout,
    maxWidth: 280,
  },
  compactDescription: {
    fontSize: typography.sizes.caption,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    backgroundColor: colors.primaryTeal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  actionButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  actionIcon: {
    marginLeft: 6,
  },
});

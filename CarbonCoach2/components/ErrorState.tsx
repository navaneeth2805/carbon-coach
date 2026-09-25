import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme/tokens';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
  fullscreen?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  secondaryActionLabel,
  onSecondaryAction,
  style,
  fullscreen = false,
  icon = 'cloud-offline-outline',
}) => {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={colors.error} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <View style={styles.buttonRow}>
        {onRetry ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRetry}
            style={styles.retryButton}
          >
            <Ionicons name="reload" size={16} color={colors.textInverse} style={styles.buttonIcon} />
            <Text style={styles.retryButtonText}>{retryLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {secondaryActionLabel && onSecondaryAction ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSecondaryAction}
            style={styles.secondaryButton}
          >
            <Ionicons name="create-outline" size={16} color={colors.primaryTeal} style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.card,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.callout,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeights.callout,
    maxWidth: 300,
  },
  buttonRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTeal,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    minWidth: 160,
  },
  retryButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: colors.primaryTeal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    minWidth: 160,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.primaryTeal,
  },
  buttonIcon: {
    marginRight: 6,
  },
});

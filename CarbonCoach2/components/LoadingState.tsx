import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { colors, typography, spacing } from '@/theme/tokens';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  style?: StyleProp<ViewStyle>;
  fullscreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Analyzing carbon metrics...',
  subMessage,
  style,
  fullscreen = false,
}) => {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, style]}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color={colors.primaryTeal} />
      </View>
      <Text style={styles.messageText}>{message}</Text>
      {subMessage ? <Text style={styles.subMessageText}>{subMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  spinnerContainer: {
    padding: spacing.md,
    borderRadius: 999,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    marginBottom: spacing.md,
  },
  messageText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subMessageText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

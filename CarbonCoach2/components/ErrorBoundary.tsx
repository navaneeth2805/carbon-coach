import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { GradientBackground } from './GradientBackground';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <GradientBackground>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-half-outline" size={44} color={colors.primaryTeal} />
              </View>

              <Text style={styles.title}>CarbonIQ Encountered an Issue</Text>
              <Text style={styles.subtitle}>
                An unexpected interface error occurred. Don't worry, your logged meals and streak data are safe.
              </Text>

              <View style={styles.card}>
                <Text style={styles.errorNotice}>
                  {this.state.error?.message || 'Unknown view render error'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.reloadButton}
                activeOpacity={0.8}
                onPress={this.handleReset}
              >
                <Ionicons name="refresh" size={18} color={colors.textInverse} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Restart View</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </GradientBackground>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.body,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xl,
  },
  errorNotice: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTeal,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
});

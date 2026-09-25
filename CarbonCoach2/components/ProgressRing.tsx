import React from 'react';
import { View, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, typography } from '@/theme/tokens';

export interface ProgressRingProps {
  progress: number; // 0 to 1 (or > 1 for overflow)
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  style?: StyleProp<ViewStyle>;
  customCenter?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 140,
  strokeWidth = 12,
  label,
  subLabel,
  style,
  customCenter,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const strokeDashoffset = circumference - clampedProgress * circumference;

  const isOverBudget = progress > 1.0;
  const ringColor1 = isOverBudget ? colors.error : colors.primaryTeal;
  const ringColor2 = isOverBudget ? '#F87171' : colors.electricBlue;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor1} />
            <Stop offset="100%" stopColor={ringColor2} />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Active Progress Ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.centerContainer}>
        {customCenter ? (
          customCenter
        ) : (
          <>
            {label ? <Text style={styles.labelText}>{label}</Text> : null}
            {subLabel ? <Text style={styles.subLabelText}>{subLabel}</Text> : null}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  subLabelText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

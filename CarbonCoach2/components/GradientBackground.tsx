import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/tokens';

interface GradientBackgroundProps extends ViewProps {
  children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style, ...rest }) => {
  return (
    <View style={[styles.container, style]} {...rest}>
      <LinearGradient
        colors={[colors.gradientDarkStart, '#0F161E', colors.gradientDarkEnd]}
        start={{ x: 0.1, y: 0.0 }}
        end={{ x: 0.9, y: 1.0 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle radial-like secondary glow for top corner */}
      <LinearGradient
        colors={['rgba(45, 212, 191, 0.05)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={styles.ambientTopGlow}
        pointerEvents="none"
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ambientTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
  },
});

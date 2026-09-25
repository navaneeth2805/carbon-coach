import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { GradientBackground } from '@/components/GradientBackground';
import { EmptyState } from '@/components/EmptyState';
import { spacing } from '@/theme/tokens';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <Stack.Screen options={{ title: 'Route Not Found', headerShown: false }} />
      <View style={styles.container}>
        <EmptyState
          icon="compass-outline"
          title="Screen Not Found"
          description="The route you navigated to doesn't exist or has moved."
          actionLabel="Return to Home"
          onAction={() => router.replace('/(tabs)')}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

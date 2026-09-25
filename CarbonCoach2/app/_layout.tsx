import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UserProfileProvider } from '@/context/UserProfileContext';
import { ScanHistoryProvider } from '@/context/ScanHistoryContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { colors } from '@/theme/tokens';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.warn('Font loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ErrorBoundary>
      <UserProfileProvider>
        <ScanHistoryProvider>
          <GamificationProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: colors.backgroundElevated,
                },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: colors.background,
                },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen
                name="result"
                options={{
                  title: 'Impact Breakdown',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="alternatives"
                options={{
                  title: 'Lower-Carbon Alternatives',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
            </Stack>
          </GamificationProvider>
        </ScanHistoryProvider>
      </UserProfileProvider>
    </ErrorBoundary>
  );
}

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useWakeLock } from '../src/hooks/useWakeLock';
import { colors } from '../src/theme';
import { supabase } from '../src/lib/supabase';
import { initWorkoutData } from '../src/data/workoutData';

export default function RootLayout() {
  useKeepAwake();
  useWakeLock();

  // Initialize workout data from Supabase (with cache fallback)
  useEffect(() => {
    initWorkoutData();
  }, []);

  // Handle OAuth callback - pick up session from URL hash after Google redirect
  useEffect(() => {
    if (Platform.OS === 'web' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.background },
          // Web headers don't need status-bar spacing; on native the default
          // spacing keeps headers below the notch.
          ...(Platform.OS === 'web' ? ({ headerStatusBarHeight: 0 } as any) : null),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ title: 'User Manual' }} />
        <Stack.Screen name="paywall" options={{ title: '' }} />
      </Stack>
    </>
  );
}

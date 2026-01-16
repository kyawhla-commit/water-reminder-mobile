import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Share, View } from 'react-native';
import 'react-native-reanimated';

import { ToastProvider, WaterFeedbackProvider } from '@/components/ui';
import { initializeNotifications } from '@/services/smartNotifications';
import { useLanguageStore } from '@/store/language';
import { useThemeStore } from '@/store/theme';
import { useUserProfileStore } from '@/store/userProfile';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  const { resolvedTheme, initializeTheme } = useThemeStore();
  const { initializeLanguage } = useLanguageStore();
  const onboardingCompleted = useUserProfileStore((state) => state.profile.onboardingCompleted);

  useEffect(() => {
    const initialize = async () => {
      initializeTheme();
      await initializeLanguage();
      
      // Initialize notifications
      try {
        const notificationsEnabled = await initializeNotifications();
        console.log('Notifications initialized:', notificationsEnabled);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
      
      // Small delay to ensure stores are hydrated
      setTimeout(() => setIsReady(true), 100);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const currentSegment = segments[0] as string;
    const inOnboarding = currentSegment === 'onboarding';

    // Only redirect if not already on the correct screen
    if (!onboardingCompleted && !inOnboarding) {
      router.replace('/onboarding' as any);
    } else if (onboardingCompleted && inOnboarding) {
      // Add a small delay to prevent race conditions
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 50);
    }
  }, [isReady, onboardingCompleted, segments]);

  const isDark = resolvedTheme === 'dark';

  const handleShare = async () => {
    try {
      await Share.share({
        message: '🎉 I just reached my daily water goal! Stay hydrated with Water Reminder app! 💧',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ToastProvider>
      <WaterFeedbackProvider onShare={handleShare}>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="notifications-settings" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="notification-test" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </ThemeProvider>
      </WaterFeedbackProvider>
    </ToastProvider>
  );
}

import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase-client';
import { soundEffects } from '@/lib/sound-effects-manager';
import { notificationManager, addNotificationResponseListener } from '@/lib/notification-manager';
import '../global.css';

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthNavigator() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, setAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Initialize sound effects and notifications
    soundEffects.init();
    notificationManager.init();

    // Check for existing session and onboarding status on app start
    Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem('hasCompletedOnboarding'),
    ]).then(([{ data: { session } }, onboardingStatus]) => {
      if (session?.user) {
        setAuthenticated({
          id: session.user.id,
          email: session.user.email || '',
        });
      }
      setHasCompletedOnboarding(onboardingStatus === 'true');
      setIsReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setAuthenticated({
            id: session.user.id,
            email: session.user.email || '',
          });
        } else {
          setAuthenticated(null);
        }
      }
    );

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener((response) => {
      const { data } = response.notification.request.content;
      console.log('[Notifications] Response received:', data);

      // Navigate based on notification type
      if (data?.screen === 'practice') {
        router.push('/(tabs)/practice');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || hasCompletedOnboarding === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    // Redirect to onboarding if not completed and not already on onboarding
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // Redirect to tabs if onboarding completed and on onboarding screen
    if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/(tabs)');
      return;
    }

    if (!isAuthenticated && inTabsGroup) {
      // Redirect to home if not authenticated (guest mode allowed)
      // Guest users can access tabs, but with limited features
    }
  }, [isAuthenticated, segments, isReady, hasCompletedOnboarding]);

  if (!isReady || hasCompletedOnboarding === null) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="lists" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="courses" options={{ headerShown: false }} />
      <Stack.Screen name="stories" options={{ headerShown: false }} />
      <Stack.Screen name="stories/new" options={{ headerShown: false }} />
      <Stack.Screen name="import" options={{ headerShown: false }} />
      <Stack.Screen name="progress" options={{ headerShown: false }} />
      <Stack.Screen name="practice-session" options={{ headerShown: false }} />
      <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="analysis/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="story/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="games" options={{ headerShown: false }} />
      <Stack.Screen
        name="capture-modal"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthNavigator />
    </QueryClientProvider>
  );
}

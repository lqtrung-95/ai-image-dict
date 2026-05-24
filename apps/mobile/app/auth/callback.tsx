import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { createSessionFromUrl } from '@/lib/oauth-sign-in';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase-client';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams();
  const { setAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async (url: string) => {
      try {
        await createSessionFromUrl(url);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          throw new Error('Session not found after sign in');
        }

        setAuthenticated({
          id: session.user.id,
          email: session.user.email || '',
        });
        router.replace('/(tabs)');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    };

    const run = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await completeAuth(initialUrl);
        return;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).flatMap(([key, value]) =>
          Array.isArray(value) ? value.map((v) => [key, v]) : [[key, String(value)]]
        )
      ).toString();

      if (queryString) {
        await completeAuth(`${Linking.createURL('auth/callback')}?${queryString}`);
      } else {
        setError('Missing auth response');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    };

    run();
  }, [params, setAuthenticated]);

  return (
    <View style={styles.container}>
      {!error ? (
        <>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.text}>Completing sign in...</Text>
        </>
      ) : (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f0f',
    gap: 16,
  },
  text: {
    color: '#9ca3af',
    fontSize: 16,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
});

---
title: "Phase 03: Supabase Authentication and Navigation Guards"
description: "Implement auth flows, session management, and protected route navigation"
---

# Phase 03: Supabase Authentication and Navigation Guards

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-02-shared-code-extraction-and-api-client-setup.md](./phase-02-shared-code-extraction-and-api-client-setup.md)
- Research: [researcher-supabase-auth-report.md](./research/researcher-supabase-auth-report.md)

## Overview
- **Priority:** P0
- **Status:** Pending
- **Description:** Implement authentication flows using Supabase Auth, session management with SecureStore, and navigation guards for protected routes.
- **Estimated Effort:** 3-4 days

## Key Insights
- Use `expo-secure-store` for token storage in production
- Handle AppState changes for token refresh
- Implement AuthContext for global auth state
- Use Expo Router's protected routes feature
- Deep linking required for email confirmation

## Requirements

### Functional Requirements
- Email/password signup and login
- Session persistence across app restarts
- Automatic token refresh
- Protected routes (redirect to login if not authenticated)
- Logout functionality
- Password reset flow

### Technical Requirements
- Supabase Auth with SecureStore
- AuthContext provider
- Navigation guards in Expo Router
- Deep linking configuration
- AppState listener for token refresh

## Architecture

### Auth Flow
```
App Launch
    ↓
Check Session (SecureStore)
    ↓
Has Session? → Yes → Protected Routes
    ↓ No
Login Screen
    ↓
Auth Success → Store Session → Protected Routes
```

### File Structure
```
app/
├── (auth)/
│   ├── _layout.tsx        # Auth group layout
│   ├── login.tsx          # Login screen
│   └── signup.tsx         # Signup screen
├── (tabs)/
│   ├── _layout.tsx        # Protected tabs layout
│   └── ...                # Protected screens
├── _layout.tsx            # Root with auth provider
hooks/
├── useAuth.ts             # Auth hook
contexts/
└── AuthContext.tsx        # Auth context provider
```

## Related Code Files
- `src/hooks/useAuth.ts` - Reference auth hook
- `src/app/(auth)/login/page.tsx` - Web login page
- `src/app/(auth)/signup/page.tsx` - Web signup page

## Implementation Steps

### Step 1: Create Auth Context
Create `contexts/AuthContext.tsx`:
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Handle app state changes for token refresh
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      subscription.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'aiimagedict://reset-password',
    });
    return { error };
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 2: Update Root Layout
Update `app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Step 3: Create Auth Group Layout
Create `app/(auth)/_layout.tsx`:
```tsx
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  // Redirect to main app if already authenticated
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
```

### Step 4: Create Protected Tabs Layout
Create `app/(tabs)/_layout.tsx`:
```tsx
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Home, Camera, BookOpen, User } from 'lucide-react-native';

export default function TabsLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capture',
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vocabulary"
        options={{
          title: 'Words',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### Step 5: Create Login Screen
Create `app/(auth)/login.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail } from '@/lib/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6 py-12">
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
          Welcome Back
        </Text>
        <Text className="text-center text-gray-500 mb-8">
          Sign in to continue learning
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="w-full bg-purple-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-500">Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-purple-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Step 6: Create Signup Screen
Create `app/(auth)/signup.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Error', passwordValidation.message);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      Alert.alert(
        'Success',
        'Please check your email to confirm your account',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6 py-12">
        <Text className="text-3xl font-bold text-center mb-2 text-gray-900">
          Create Account
        </Text>
        <Text className="text-center text-gray-500 mb-8">
          Start your Chinese learning journey
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Min 8 chars, uppercase, lowercase, number"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
            <TextInput
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={isLoading}
            className="w-full bg-purple-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-500">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-purple-600 font-semibold">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

### Step 7: Configure Deep Linking
Update `app.json`:
```json
{
  "expo": {
    "scheme": "aiimagedict",
    "ios": {
      "bundleIdentifier": "com.aiimagedict.app",
      "associatedDomains": ["applinks:aiimagedict.com"]
    },
    "android": {
      "package": "com.aiimagedict.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "aiimagedict",
              "host": "*"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Todo List
- [ ] Create AuthContext with session management
- [ ] Implement sign in method
- [ ] Implement sign up method
- [ ] Implement sign out method
- [ ] Add AppState listener for token refresh
- [ ] Create auth group layout with redirect
- [ ] Create protected tabs layout
- [ ] Build login screen UI
- [ ] Build signup screen UI
- [ ] Add form validation
- [ ] Configure deep linking
- [ ] Test auth flow on iOS
- [ ] Test auth flow on Android
- [ ] Handle password reset flow

## Success Criteria
- [ ] Users can sign up with email/password
- [ ] Users can log in with email/password
- [ ] Session persists across app restarts
- [ ] Protected routes redirect to login when not authenticated
- [ ] Auth routes redirect to main app when already authenticated
- [ ] Token refresh works correctly
- [ ] Logout clears session

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| SecureStore token corruption | Low | High | Implement token validation |
| Deep linking not working | Medium | Medium | Test on real devices |
| Session timeout handling | Medium | Medium | Implement retry logic |

## Security Considerations
- Tokens stored in encrypted SecureStore
- Password validation enforced client-side
- HTTPS only for API calls
- Session auto-refresh implemented

## Next Steps
After completing this phase, proceed to [Phase 04: Core UI Components](./phase-04-core-ui-components-and-design-system.md) to build the component library.

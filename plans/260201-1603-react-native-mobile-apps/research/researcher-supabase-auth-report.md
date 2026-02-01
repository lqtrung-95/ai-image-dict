# Research Report: Supabase Auth with React Native (Expo)

## Executive Summary

Supabase Auth integrates seamlessly with React Native/Expo via `@supabase/supabase-js`. Use `AsyncStorage` for token persistence with `processLock` for race condition prevention. For enhanced security, wrap storage with `expo-secure-store`. Native OAuth (Apple/Google) uses `signInWithIdToken` with platform-specific libraries. Deep linking requires URL scheme configuration in `app.json`.

## Key Findings

### 1. SDK Compatibility

`@supabase/supabase-js` v2 supports React Native with fetch polyfills. Required deps:
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store react-native-url-polyfill
```

### 2. Secure Storage

**AsyncStorage (default)**: Non-encrypted, suitable for development. Use with `processLock`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
```

**expo-secure-store adapter** (production):
```typescript
import * as SecureStore from 'expo-secure-store';

const SecureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
```

Note: SecureStore has ~2048 byte limit on some iOS versions.

### 3. Session Persistence & Refresh

Handle app state changes for token refresh:
```typescript
import { AppState } from 'react-native';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
```

### 4. Deep Linking

Configure URL scheme in `app.json`:
```json
{
  "expo": {
    "scheme": "myapp",
    "ios": { "bundleIdentifier": "com.example.myapp" },
    "android": { "package": "com.example.myapp" }
  }
}
```

Add redirect URL to Supabase Auth settings: `myapp://callback`

### 5. OAuth Providers

**Apple Sign-In (iOS)**:
```typescript
import { appleAuth } from '@invertase/react-native-apple-authentication';

const appleRes = await appleAuth.performRequest({
  requestedOperation: appleAuth.Operation.LOGIN,
  requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
});

await supabase.auth.signInWithIdToken({
  provider: 'apple',
  token: appleRes.identityToken,
  nonce: appleRes.nonce,
});
```

**Google Sign-In**: Use `@react-native-google-signin/google-signin` or web flow with `expo-web-browser`.

### 6. Auth Context Pattern

```typescript
const AuthContext = createContext({
  session: null as Session | null,
  user: null as User | null,
  isLoading: true,
  signIn: async (email: string, password: string) => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = { session, user: session?.user ?? null, isLoading, signIn, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### 7. Navigation Guards

With React Navigation v6+:
```typescript
function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack.Navigator>
      {session ? (
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
```

With Expo Router:
```typescript
function RootLayout() {
  const { isLoggedIn } = useAuth();
  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
```

## Implementation Checklist

- [ ] Install deps: `@supabase/supabase-js`, `async-storage`, `secure-store`, `url-polyfill`
- [ ] Configure storage adapter with `processLock`
- [ ] Add app state listener for auto-refresh
- [ ] Setup URL scheme in `app.json`
- [ ] Configure redirect URLs in Supabase dashboard
- [ ] Implement AuthContext with `onAuthStateChange`
- [ ] Add navigation guards (conditional rendering)
- [ ] Setup native OAuth libraries per platform
- [ ] Handle email verification deep links

## Unresolved Questions

1. Best approach for handling refresh token rotation edge cases?
2. Recommended pattern for biometric auth integration with SecureStore?
3. Handling auth state during offline mode?

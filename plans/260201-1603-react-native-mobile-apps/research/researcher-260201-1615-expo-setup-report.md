# Expo React Native Setup Best Practices 2026

**Research Date:** 2026-02-01
**Expo SDK:** 52+
**React Native:** 0.76

---

## 1. Expo SDK 52+ Features & Requirements

### Core Specs
| Component | Version |
|-----------|---------|
| React Native | 0.76 |
| React | 18.3.1 |
| React Native Web | 0.19.13 |
| Minimum Node.js | 20.18.x |

### Platform Requirements
- **Android**: 7+, compileSdkVersion 35, targetSdkVersion 34
- **iOS**: 15.1+, Xcode 16.0+

### New APIs (SDK 52)
- `expo-audio` - Replaces deprecated `expo-av` audio
- `expo-video` - Replaces deprecated `expo-av` video
- `expo-background-task` - Replaces deprecated `expo-background-fetch`
- `expo-file-system/next` - Modern filesystem API
- `expo-fingerprint` - New fingerprint authentication
- `expo-live-photo` - Live Photo support
- Apple TV support for multiple modules

### Breaking Changes
- `expo-av` deprecated (use `expo-audio`/`expo-video`)
- `expo-background-fetch` deprecated
- `expo-file-system` modern API is now default
- `expo-image-picker` web uses blob URLs (not base64)

---

## 2. TypeScript Configuration

### Setup
```bash
npx create-expo-app@latest -t default  # Includes TS
# OR migrate existing:
npx expo install typescript @types/react --dev
npx expo customize tsconfig.json
```

### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Key Points
- Always extend `expo/tsconfig.base`
- Enable `strict: true` for production apps
- Restart Expo CLI after modifying path aliases
- Path aliases add resolution time; Metro only (not webpack)

---

## 3. Project Structure Best Practices

### Recommended Structure
```
app/                    # File-based routing (Expo Router)
  (tabs)/              # Route groups
    _layout.tsx        # Tab navigator config
    index.tsx          # Home screen
    explore.tsx        # Explore screen
  _layout.tsx          # Root layout
components/            # Reusable UI components
hooks/                 # Custom React hooks
constants/             # App-wide constants
assets/                # Images, fonts
scripts/               # Build/automation scripts
```

### Conventions
- Use `(group)` for route groups (no URL impact)
- `_layout.tsx` files configure navigators
- Keep components under 200 lines
- Use kebab-case for file names

---

## 4. Navigation: Expo Router vs React Navigation

### Expo Router (Recommended for New Projects)

**Pros:**
- File-based routing (well-known concept)
- Automatic deep linking for every screen
- Static type generation for routes
- SEO support on web (static rendering)
- Lazy bundling/optimization
- Universal: Android, iOS, web share structure

**Cons:**
- Opinionated file structure
- Learning curve for complex layouts

### React Navigation

**Use when:**
- Existing React Native app (migration)
- Complex custom navigation patterns
- File-based routing doesn't fit

### Verdict
**Choose Expo Router** for new 2026 projects. It's a superset of React Navigation—you can still use React Navigation components if needed.

---

## 5. State Management

### Zustand (Recommended)

```bash
npm install zustand
```

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: () => void
}

const useStore = create<BearState>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
}))
```

**Why Zustand:**
- No context providers needed
- Minimal boilerplate
- Selective subscriptions (performance)
- Works outside components (getState/setState)
- Small bundle size

### Alternatives
| Library | Use Case |
|---------|----------|
| Redux Toolkit | Complex apps, time-travel debugging |
| Context API | Simple prop drilling, theme/auth |
| TanStack Query | Server state (API caching) |

---

## 6. Styling Approaches

### NativeWind v4 (Recommended)

```bash
npm install nativewind
npm install tailwindcss@3 postcss autoprefixer --dev
```

**tailwind.config.js:**
```javascript
module.exports = {
  content: ['./app/**/*.{js,tsx,ts,jsx}'],
  theme: { extend: {} },
}
```

**Usage:**
```tsx
<View className="flex-1 bg-white dark:bg-black p-4">
  <Text className="text-lg font-bold">Hello</Text>
</View>
```

**Features:**
- Platform variants: `ios:` / `android:`
- Dark mode support
- CSS animations
- P3 color gamut

### Comparison
| Approach | Pros | Cons |
|----------|------|------|
| **NativeWind** | Tailwind syntax, universal | Build setup |
| **StyleSheet** | Native, no deps | Verbose, no reuse |
| **Tamagui** | Universal, performant | Learning curve |
| **React Native Paper** | Material Design | Opinionated |

---

## 7. Testing Setup

### Installation
```bash
npx expo install jest-expo jest @types/jest --dev
npx expo install @testing-library/react-native --dev
```

### package.json
```json
{
  "scripts": {
    "test": "jest --watchAll"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
    ]
  }
}
```

### Example Test
```tsx
import { render } from '@testing-library/react-native'
import HomeScreen from '@/app/index'

describe('<HomeScreen />', () => {
  test('renders correctly', () => {
    const { getByText } = render(<HomeScreen />)
    getByText('Welcome!')
  })
})
```

---

## 8. Environment Configuration

### EAS Environment Variables

```bash
# Create variable
eas env:create --name EXPO_PUBLIC_API_URL \
  --value https://api.example.com \
  --environment production \
  --visibility plainText
```

### Visibility Types
| Type | Description |
|------|-------------|
| Plain text | Visible everywhere |
| Sensitive | Obfuscated in logs |
| Secret | Not readable outside EAS servers |

### eas.json
```json
{
  "build": {
    "production": {
      "environment": "production"
    }
  }
}
```

### Client-Side Usage
```typescript
// Use EXPO_PUBLIC_ prefix for client-side
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

**Important:** Client-side env vars are public—never put secrets in `EXPO_PUBLIC_*`.

---

## Summary Recommendations

| Category | Recommendation |
|----------|----------------|
| **Navigation** | Expo Router |
| **State** | Zustand + TanStack Query |
| **Styling** | NativeWind v4 |
| **Testing** | Jest + React Native Testing Library |
| **Env Vars** | EAS Environment Variables |
| **Node** | 20.18.x+ |

---

## Unresolved Questions

1. Does the existing Capacitor codebase share code with Expo, or is a separate repo better?
2. Should we use Expo Dev Client for custom native modules?
3. What's the migration path from Capacitor plugins to Expo modules?

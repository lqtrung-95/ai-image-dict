---
title: "Phase 01: Expo Project Setup and Configuration"
description: "Initialize Expo React Native project with TypeScript, configure build tools and environment"
---

# Phase 01: Expo Project Setup and Configuration

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Research: [researcher-260201-1615-expo-setup-report.md](./research/researcher-260201-1615-expo-setup-report.md)

## Overview
- **Priority:** P0
- **Status:** Completed
- **Description:** Initialize the Expo React Native project with TypeScript, configure build tools, environment variables, and project structure.
- **Estimated Effort:** 2-3 days

## Key Insights
- Expo SDK 52 requires Node.js 20.18+
- Use Expo Router for file-based routing (recommended for new projects)
- NativeWind v4 provides Tailwind CSS compatibility
- EAS Environment Variables for secure configuration

## Requirements

### Functional Requirements
- Working Expo project with TypeScript
- File-based routing with Expo Router
- Tailwind CSS styling via NativeWind
- Environment variable configuration
- Testing setup with Jest

### Technical Requirements
- Node.js 20.18.x or higher
- Expo SDK 52+
- React Native 0.76+
- TypeScript strict mode

## Architecture

### Project Structure
```
apps/mobile/
├── app/                    # Expo Router routes
│   ├── (auth)/            # Auth group
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/            # Main tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx      # Home/Dashboard
│   │   ├── capture.tsx
│   │   ├── vocabulary.tsx
│   │   ├── practice.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx        # Root layout with auth
│   └── +not-found.tsx
├── components/
├── hooks/
├── lib/
├── stores/
├── types/
├── assets/
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Related Code Files
- Reference web app structure: `src/app/layout.tsx`
- Reference types: `src/types/index.ts`

## Implementation Steps

### Step 1: Initialize Expo Project
```bash
cd /Users/lequoctrung/Documents/Personal Projects/ai-image-dict
npx create-expo-app@latest apps/mobile --template default
cd apps/mobile
```

### Step 2: Install Core Dependencies
```bash
# Navigation (Expo Router is included in template)
npx expo install expo-router

# Styling
npm install nativewind
npm install tailwindcss@3 postcss autoprefixer --save-dev

# State Management
npm install zustand
npm install @tanstack/react-query

# Storage
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store
npx expo install expo-sqlite

# UI Components
npx expo install expo-image-picker
npx expo install expo-image-manipulator
npx expo install expo-file-system
npx expo install expo-speech
npx expo install expo-audio
npx expo install expo-haptics

# Utilities
npm install react-native-reanimated
npm install react-native-gesture-handler
npm install @react-native-community/netinfo
```

### Step 3: Configure TypeScript
Create `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

### Step 4: Configure NativeWind
Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          dark: '#6d28d9',
        },
      },
    },
  },
  plugins: [],
}
```

Create `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel', 'react-native-reanimated/plugin'],
  };
};
```

Create `metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

Create `global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 5: Configure Expo Router
Update `app.json`:
```json
{
  "expo": {
    "name": "AI Image Dictionary",
    "slug": "ai-image-dict",
    "scheme": "aiimagedict",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#7c3aed"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.aiimagedict.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#7c3aed"
      },
      "package": "com.aiimagedict.app"
    },
    "plugins": [
      "expo-router",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow AI Image Dictionary to access your photos for vocabulary learning."
        }
      ]
    ]
  }
}
```

### Step 6: Setup Testing
Install testing dependencies:
```bash
npx expo install jest-expo jest @types/jest --save-dev
npx expo install @testing-library/react-native --save-dev
```

Update `package.json`:
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

### Step 7: Create Basic App Structure
Create `app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
```

## Todo List
- [x] Initialize Expo project with TypeScript template
- [x] Install all core dependencies
- [x] Configure TypeScript with strict mode
- [x] Setup NativeWind with Tailwind CSS
- [x] Configure Expo Router
- [x] Create basic folder structure
- [x] Configure app.json with proper metadata
- [x] Document setup instructions
- [ ] Setup Jest testing framework
- [ ] Add app icons and splash screen assets
- [ ] Test build on iOS simulator
- [ ] Test build on Android emulator

## Success Criteria
- [x] TypeScript compiles without errors
- [x] NativeWind styling works
- [x] Expo Router navigation works
- [x] Project structure created
- [x] Dependencies installed
- [ ] Project builds successfully on iOS simulator
- [ ] Project builds successfully on Android emulator
- [ ] Tests run successfully

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Node version incompatibility | Medium | High | Use nvm to manage Node versions |
| NativeWind configuration issues | Medium | Medium | Follow official docs carefully |
| iOS/Android build issues | Low | High | Test early on both platforms |

## Security Considerations
- Environment variables use `EXPO_PUBLIC_` prefix for client-side
- Never commit sensitive keys to repository
- Use EAS Environment Variables for production secrets

## Next Steps
After completing this phase, proceed to [Phase 02: Shared Code Extraction](./phase-02-shared-code-extraction-and-api-client.md) to extract reusable code from the web app.

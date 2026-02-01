# AI Image Dictionary - Mobile App

React Native mobile app built with Expo SDK 52+ for iOS and Android.

## Features

- **Authentication**: Supabase Auth with SecureStore for token persistence
- **Photo Analysis**: Capture or upload photos for AI-powered Chinese vocabulary extraction
- **Vocabulary Management**: View, search, and organize saved words
- **Practice Modes**: Flashcards, multiple choice, and listening exercises
- **Offline Support**: SQLite for local data storage
- **Dark Mode**: Automatic theme switching

## Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **State Management**: Zustand (client), TanStack Query (server)
- **Auth**: Supabase Auth with expo-secure-store
- **Storage**: expo-sqlite for offline data
- **Camera**: expo-image-picker
- **TTS**: expo-speech

## Project Structure

```
app/
├── (auth)/           # Auth screens (login, signup)
├── (tabs)/           # Main tab navigation
│   ├── index.tsx     # Home/Dashboard
│   ├── capture.tsx   # Photo capture & analysis
│   ├── vocabulary.tsx # Vocabulary list
│   ├── practice.tsx  # Practice modes
│   └── settings.tsx  # Settings & profile
├── _layout.tsx       # Root layout
lib/
├── types.ts          # TypeScript types
├── constants.ts      # App constants
├── validation.ts     # Input validation
├── api-client.ts     # API client
├── supabase-client.ts # Supabase client
└── image-utils.ts    # Image utilities
components/           # Reusable components
hooks/                # Custom hooks
stores/               # Zustand stores
types/                # Type definitions
```

## Getting Started

### Prerequisites

- Node.js 20.18+
- npm or yarn
- iOS: Xcode (Mac only)
- Android: Android Studio

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials:
# - EXPO_PUBLIC_SUPABASE_URL
# - EXPO_PUBLIC_SUPABASE_ANON_KEY
# - EXPO_PUBLIC_API_BASE_URL

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Environment Variables

Create a `.env` file in the mobile directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_BASE_URL=https://your-api-url.com
```

## API Integration

The mobile app connects to the existing Next.js API:

- `POST /api/analyze` - Analyze photo and extract vocabulary
- `GET /api/vocabulary` - Get user's vocabulary
- `GET /api/stats` - Get learning statistics
- `GET /api/word-of-day` - Get daily word
- `GET /api/practice/due-words` - Get words due for review

## Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Or use EAS Build
npx eas build --platform ios
npx eas build --platform android
```

## License

MIT

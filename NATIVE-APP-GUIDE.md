# Native App Development Guide (iOS & Android)

This guide explains how to build and run the AI Image Dictionary app as a native iOS and Android app using Capacitor.

## Prerequisites

### iOS Development
- macOS with Xcode 15+ installed
- Apple Developer Account (for device testing and App Store)
- CocoaPods: `sudo gem install cocoapods`

### Android Development
- Android Studio installed
- Android SDK with API 33+
- Java JDK 17+

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode (Recommended)

During development, use the live reload server for instant updates:

```bash
# Terminal 1 - Start Next.js dev server
npm run dev

# Terminal 2 - Run on iOS simulator with live reload
npx cap run ios --livereload --external

# Or run on Android emulator
npx cap run android --livereload --external
```

For testing on a physical device, update your `.env.local`:
```bash
# Get your computer's local IP: ifconfig | grep "inet "
CAPACITOR_SERVER_URL=http://192.168.1.XXX:3000
```

### 3. Initialize Native Platforms (First Time Only)

```bash
npm run native:init
```

This will:
- Build the web app
- Add iOS and Android platforms
- Install native dependencies

### 4. Open in Native IDE

```bash
# Open iOS project in Xcode
npm run native:ios

# Open Android project in Android Studio
npm run native:android
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run native:init` | Initialize iOS/Android platforms (first time setup) |
| `npm run native:build` | Build web app and sync to native platforms |
| `npm run native:sync` | Sync web assets to native platforms |
| `npm run native:ios` | Open iOS project in Xcode |
| `npm run native:android` | Open Android project in Android Studio |
| `npm run native:run:ios` | Run on iOS simulator |
| `npm run native:run:android` | Run on Android emulator |

## Native Features

### Camera
The app uses Capacitor's native Camera plugin for better performance:
- Native camera UI on iOS/Android
- Photo library access
- Better image quality and performance

### Storage
- **iOS**: App documents directory
- **Android**: App private storage

### Authentication
Supabase auth works seamlessly in native apps with session persistence.

## Development Workflow

### Making Changes

1. **Web changes**: Edit files as normal, changes reflect immediately with live reload
2. **Native changes**: After modifying web code, sync to native:
   ```bash
   npm run native:sync
   ```

### Testing on Device

#### iOS Device
1. Connect iPhone via USB
2. Open `ios/App.xcworkspace` in Xcode
3. Select your device from the target dropdown
4. Set your Apple Developer Team in Signing & Capabilities
5. Build and run

#### Android Device
1. Enable USB debugging on your Android device
2. Connect via USB
3. Run: `npx cap run android --external`
4. Or open Android Studio and select your device

## Configuration

### iOS Permissions

Open `ios/App/App/Info.plist` in Xcode and add:

```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture photos for vocabulary learning</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to select images for vocabulary learning</string>

<!-- Microphone (for TTS) -->
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for audio pronunciation features</string>
```

### Android Permissions

Open `android/app/src/main/AndroidManifest.xml` and add:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## App Store Preparation

### iOS App Store

1. **Create App Store Connect record**
   - Go to https://appstoreconnect.apple.com
   - Create new iOS app
   - Bundle ID: `com.aiimagedict.app`

2. **Configure app icons**
   - Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset`
   - Or use: https://capacitorjs.com/docs/guides/splash-screens-and-icons

3. **Set up signing**
   - In Xcode: Project → Signing & Capabilities
   - Select your Apple Developer Team
   - Enable automatic signing

4. **Archive and upload**
   - Product → Archive
   - Distribute App → App Store Connect

### Google Play Store

1. **Create Play Console record**
   - Go to https://play.google.com/console
   - Create new app
   - Package name: `com.aiimagedict.app`

2. **Generate signed AAB**
   - In Android Studio: Build → Generate Signed Bundle/APK
   - Create or select keystore
   - Upload generated `.aab` file to Play Console

3. **App signing**
   - Google Play will sign your app automatically
   - Follow Play Console instructions

## Troubleshooting

### Build Errors

**iOS:**
```bash
cd ios && pod install --repo-update
# Clean build: Cmd+Shift+K in Xcode
```

**Android:**
- File → Invalidate Caches → Invalidate and Restart
- Build → Clean Project

### White Screen
1. Check that `CAPACITOR_SERVER_URL` is correct
2. Ensure your device and computer are on the same network
3. Check the Safari/Chrome DevTools console for errors

### Camera Not Working
1. Ensure camera permissions are added to native config
2. Check that Capacitor Camera plugin is synced: `npx cap sync`

### API Calls Failing
- In development: Ensure dev server is running
- In production: Check that your deployed URL is correct in `.env.local`

## Architecture

```
┌─────────────────────────────────────────────┐
│  Native App (iOS/Android)                   │
│  ┌───────────────────────────────────────┐  │
│  │  Capacitor WebView                    │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  Next.js React App              │  │  │
│  │  │  ┌──────────┐  ┌──────────────┐ │  │  │
│  │  │  │  Web UI  │  │  Native API  │ │  │  │
│  │  │  │          │  │  (Camera,    │ │  │  │
│  │  │  │          │  │  Storage)    │ │  │  │
│  │  │  └──────────┘  └──────────────┘ │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │  Supabase API    │
           │  (Auth, Database)│
           └──────────────────┘
```

## Key Files

- `capacitor.config.ts` - Capacitor configuration
- `next.config.ts` - Next.js configuration
- `src/hooks/use-native-camera.ts` - Native camera hook
- `src/app/(protected)/capture-native/page.tsx` - Native camera page

## Learn More

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [iOS Development](https://developer.apple.com/documentation/xcode)
- [Android Development](https://developer.android.com/studio/intro)

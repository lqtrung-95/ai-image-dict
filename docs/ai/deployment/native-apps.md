# Native App Deployment Guide (Capacitor)

This guide covers building and deploying the AI Image Dictionary to iOS App Store and Google Play Store using Capacitor.

## Prerequisites

### iOS
- Mac with macOS 12+
- Xcode 14+ (from App Store)
- Apple Developer Account ($99/year) - [developer.apple.com](https://developer.apple.com)
- CocoaPods: `sudo gem install cocoapods`

### Android
- Android Studio (free) - [developer.android.com/studio](https://developer.android.com/studio)
- Google Play Developer Account ($25 one-time) - [play.google.com/console](https://play.google.com/console)
- Java 17+

## Initial Setup

### 1. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### 2. Add Native Platforms

```bash
npx cap add ios
npx cap add android
```

### 3. Install Useful Plugins (Optional)

```bash
# Native camera (better than WebRTC on mobile)
npm install @capacitor/camera

# Push notifications
npm install @capacitor/push-notifications

# Haptics feedback
npm install @capacitor/haptics

# Splash screen control
npm install @capacitor/splash-screen

# Status bar styling
npm install @capacitor/status-bar
```

## Build Process

### 1. Set Environment Variables

Create `.env.native` for native builds:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Build Static Export

```bash
# Load native env and build
cp .env.native .env.local
npm run build
```

> **Note:** This creates the `out/` directory that Capacitor uses.

### 3. Sync to Native Projects

```bash
npx cap sync
```

This copies web assets and updates native dependencies.

## iOS Deployment

### 1. Open Xcode

```bash
npx cap open ios
```

### 2. Configure Signing

1. Select the project in the left sidebar
2. Go to "Signing & Capabilities"
3. Select your Team (Apple Developer account)
4. Xcode will auto-create provisioning profiles

### 3. Update Bundle Identifier

Change `com.aiimagedict.app` to your actual bundle ID in:
- Xcode project settings
- `capacitor.config.ts`

### 4. Add App Icons

Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Required sizes: 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024

### 5. Configure Camera Permissions

Add to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>AI词典 needs camera access to capture photos for vocabulary learning</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>AI词典 needs photo library access to analyze your photos</string>
```

### 6. Build & Submit

1. Product → Archive
2. Window → Organizer → Distribute App
3. Choose "App Store Connect"
4. Follow prompts to upload

### 7. App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create new app
3. Fill metadata, screenshots, description
4. Submit for review (typically 24-48 hours)

## Android Deployment

### 1. Open Android Studio

```bash
npx cap open android
```

### 2. Update Package Name

In `android/app/build.gradle`:

```gradle
android {
    namespace "com.aiimagedict.app"
    defaultConfig {
        applicationId "com.aiimagedict.app"
        // ...
    }
}
```

### 3. Add App Icons

Place icons in `android/app/src/main/res/`:
- `mipmap-hdpi/` (72x72)
- `mipmap-mdpi/` (48x48)
- `mipmap-xhdpi/` (96x96)
- `mipmap-xxhdpi/` (144x144)
- `mipmap-xxxhdpi/` (192x192)

### 4. Configure Permissions

Already in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
```

### 5. Generate Signed APK/Bundle

1. Build → Generate Signed Bundle / APK
2. Create new keystore (save securely!)
3. Choose "Android App Bundle" for Play Store
4. Select "release" build variant

### 6. Google Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app
3. Complete app content questionnaire
4. Upload AAB file
5. Add screenshots, description
6. Submit for review (typically 1-7 days)

## Development Workflow

### Live Reload (Development)

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Run on device/simulator with live reload
npx cap run ios --livereload --external
npx cap run android --livereload --external
```

### Quick Sync After Code Changes

```bash
npm run build && npx cap sync
```

### Testing on Devices

```bash
# iOS Simulator
npx cap run ios

# Android Emulator
npx cap run android

# Physical device (iOS - requires provisioning)
npx cap run ios --device

# Physical device (Android - enable USB debugging)
npx cap run android --device
```

## Troubleshooting

### iOS: "No signing certificate"
→ Open Xcode, go to Preferences → Accounts → Download certificates

### Android: "SDK location not found"
→ Create `android/local.properties` with: `sdk.dir=/Users/YOU/Library/Android/sdk`

### API calls failing in native app
→ Ensure `NEXT_PUBLIC_API_BASE_URL` is set to your deployed Vercel URL

### Camera not working
→ Use `@capacitor/camera` plugin instead of WebRTC for better native support

### App rejected for "minimal functionality"
→ Add native-only features: push notifications, widgets, haptic feedback

## Recommended: Add Native Features

To differentiate from "just a web wrapper" and avoid App Store rejection:

```typescript
// Using Capacitor plugins
import { Camera, CameraResultType } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';

// Native camera
const photo = await Camera.getPhoto({
  quality: 90,
  resultType: CameraResultType.Base64,
});

// Haptic feedback on save
await Haptics.impact({ style: ImpactStyle.Medium });
```

## Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "native:build": "npm run build && npx cap sync",
    "native:ios": "npx cap open ios",
    "native:android": "npx cap open android",
    "native:run:ios": "npx cap run ios",
    "native:run:android": "npx cap run android"
  }
}
```


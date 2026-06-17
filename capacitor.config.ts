import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aiimagedict.app',
  appName: 'AI Image Dictionary',
  webDir: 'dist',
  server: {
    // Use deployed Vercel app for SPA experience
    url: 'https://snap-mandarin.vercel.app',
    allowNavigation: ['snap-mandarin.vercel.app', '*.supabase.co'],
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#a855f7',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
  },
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;

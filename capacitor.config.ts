import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aiimagedict.app',
  appName: 'AI词典',
  webDir: 'out',
  server: {
    // Use your deployed Vercel URL for API calls
    // This allows the native app to call your existing API routes
    url: process.env.CAPACITOR_SERVER_URL,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
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
    scheme: 'AI词典',
  },
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
  },
};

export default config;


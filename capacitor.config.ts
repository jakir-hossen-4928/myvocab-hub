import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sajuriyastudio.myvocabhub',
  appName: 'MyVocab Hub',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#ffffff',
  android: {
    // Version must stay in sync with src/version.ts and android/app/build.gradle
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
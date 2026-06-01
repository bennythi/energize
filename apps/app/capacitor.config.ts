import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.energize-festival.app',
  appName: 'ENERGIZE',
  webDir: 'build',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#000000',
  },
  ios: {
    backgroundColor: '#000000',
    contentInset: 'always',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;

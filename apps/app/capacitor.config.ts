import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.energize-festival.app',
  appName: 'ENERGIZE',
  webDir: 'build',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#0A0A0A',
  },
  ios: {
    backgroundColor: '#0A0A0A',
    contentInset: 'always',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;

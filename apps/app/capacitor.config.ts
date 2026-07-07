import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.energize_festival.app',
  appName: 'ENERGIZE',
  webDir: 'build',
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

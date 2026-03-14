import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kikoba.app',
  appName: 'Kikoba',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['192.168.1.10:3000']
  }
};

export default config;

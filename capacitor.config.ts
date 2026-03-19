import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kikoba.app',
  appName: 'Kikoba',
  webDir: 'out',
  server: {
    url: 'http://192.168.0.101:3000',
    cleartext: true,
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;

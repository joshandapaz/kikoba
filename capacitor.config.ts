import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kikoba.app',
  appName: 'Kikoba',
  webDir: 'out',
  server: {
    url: 'https://YOUR_NETLIFY_SITE_NAME.netlify.app',
    cleartext: false,
  },
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;

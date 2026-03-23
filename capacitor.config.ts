import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kikoba.app',
  appName: 'Kikoba',
  webDir: 'out',
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
  server: {
    url: "http://192.168.0.101:5172",
    cleartext: true
  }
};


export default config;

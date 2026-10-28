import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rajnandni.pos',
  appName: 'Rajnandini Boutique',
  webDir: 'out',
  server: {
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;

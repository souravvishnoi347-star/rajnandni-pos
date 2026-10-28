import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rajnandni.pos',
  appName: 'Rajnandini Boutique',
  webDir: 'out',
  server: {
    url: 'https://rajnandni-pos.vercel.app/owner',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;

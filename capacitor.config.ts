import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rajnandni.pos',
  appName: 'Rajnandini Boutique',
  webDir: 'out',
  server: {
    // Ye app live Vercel smart gateway load karegi taaki phone me realtime Supabase sync rahe aur role-based access ho
    url: 'https://rajnandni-pos.vercel.app/app',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;

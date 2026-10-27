import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rajnandni.pos',
  appName: 'Rajnandini Boutique POS',
  webDir: 'out',
  server: {
    // Ye app live Vercel URL load karegi taaki phone me realtime Supabase sync rahe aur offline fallback bhi
    url: 'https://rajnandni-pos.vercel.app/owner',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;

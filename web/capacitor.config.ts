import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.openpos.mobile',
  appName: 'OpenPOS',
  webDir: 'dist-offline',
  plugins: {
    SystemBars: {
      insetsHandling: 'native',
    },
  },
};

export default config;

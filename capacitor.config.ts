import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.capawesome.capacitorsqlitedemoreact',
  appName: 'Capacitor SQLite Demo React',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;

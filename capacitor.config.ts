import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.dravec.autoskola',
  appName: 'Autoškola',
  webDir: 'dist',
  ios: { contentInset: 'automatic' },
  plugins: {
    // We only use Apple (iOS) and Google (Android) sign-in; disabling the
    // rest keeps them out of the bundle (and avoids Facebook SDK's AD_ID
    // permission tripping Play Console review, per plugin docs).
    SocialLogin: {
      providers: { google: true, apple: true, facebook: false, twitter: false },
    },
  },
}

export default config

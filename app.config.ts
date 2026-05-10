import type { ExpoConfig } from 'expo/config';

import pkg from './package.json';

/**
 * Monotonic Android versionCode. EAS `autoIncrement` bumps from the last successful build;
 * this is the baseline for the first Play upload.
 * Override locally: `ANDROID_VERSION_CODE=42 npx eas-cli build ...`
 */
const androidVersionCode = (() => {
  const fromEnv = process.env.ANDROID_VERSION_CODE;
  if (fromEnv && /^\d+$/.test(fromEnv)) {
    return parseInt(fromEnv, 10);
  }
  return 1;
})();

// Expo's `ExpoConfig` type can lag new manifest keys; runtime config is validated by `expo config`.
export default (): ExpoConfig =>
  ({
    name: 'Subhchandra Organics',
    slug: 'subhchandra-webview',
    version: pkg.version,
    orientation: 'portrait',
    platforms: ['android'],
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    backgroundColor: '#fafafa',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    android: {
      // TODO: replace with your Play Console applicationId before going live
      package: 'com.subhchandraorganics.webapp',
      versionCode: androidVersionCode,
      permissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'resize',
      statusBar: {
        barStyle: 'dark-content',
        backgroundColor: '#fafafa',
      },
      navigationBar: {
        barStyle: 'dark-content',
        backgroundColor: '#fafafa',
      },
    },
    plugins: [
      'expo-web-browser',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#000000',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            enableProguardInReleaseBuilds: false,
          },
        },
      ],
    ],
    extra: {
      // Optional: `eas init` / `eas project:info` can populate `eas.projectId` for EAS Update.
      eas: {},
    },
  }) as ExpoConfig;

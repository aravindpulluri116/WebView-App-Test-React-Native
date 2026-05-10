import { useEffect } from 'react';
import { Alert, BackHandler } from 'react-native';

import { APP_DISPLAY_NAME } from '../constants/config';

type UseWebViewAndroidBackHandlerOptions = {
  /** When true, hardware back is ignored (e.g. offline overlay). */
  disabled?: boolean;
  /** Whether the WebView has history to pop. */
  canGoBack: boolean;
  /** Navigate back inside the WebView. */
  onWebViewGoBack: () => void;
};

/**
 * Hardware back: WebView history first, then a confirmation before exiting the app.
 */
export function useWebViewAndroidBackHandler({
  disabled = false,
  canGoBack,
  onWebViewGoBack,
}: UseWebViewAndroidBackHandlerOptions): void {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (disabled) {
        return false;
      }

      if (canGoBack) {
        onWebViewGoBack();
        return true;
      }

      Alert.alert(
        'Exit app?',
        `Leave ${APP_DISPLAY_NAME}? You can return anytime; your login is kept on this device.`,
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              BackHandler.exitApp();
            },
          },
        ],
        { cancelable: true },
      );
      return true;
    });

    return () => sub.remove();
  }, [disabled, canGoBack, onWebViewGoBack]);
}

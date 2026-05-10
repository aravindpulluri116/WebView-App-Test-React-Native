import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';

/**
 * Keeps the native splash visible until the first successful WebView load (or error),
 * with a safety timeout. When offline, only the native splash is dismissed so the offline UI shows.
 */
export function useSplashScreen(isOffline: boolean) {
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    void SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    const maxWait = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 12000);
    return () => clearTimeout(maxWait);
  }, []);

  useEffect(() => {
    if (isOffline) {
      void SplashScreen.hideAsync();
    }
  }, [isOffline]);

  const hideSplashOnce = useCallback(() => {
    if (!initialLoadDone) {
      setInitialLoadDone(true);
      void SplashScreen.hideAsync();
    }
  }, [initialLoadDone]);

  return { initialLoadDone, hideSplashOnce };
}

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Runs a callback when the app returns to the foreground.
 * Does not reload the WebView by default (avoids breaking in-flight Razorpay / UPI flows).
 */
export function useAppResumeEffect(onResume: () => void): void {
  const phaseRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = phaseRef.current;
      phaseRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        onResume();
      }
    });
    return () => sub.remove();
  }, [onResume]);
}

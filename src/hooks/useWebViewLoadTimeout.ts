import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const SLOW_LOAD_MS = 45_000;

type UseWebViewLoadTimeoutOptions = {
  enabled: boolean;
  onSlowLoad: () => void;
};

/**
 * Surfaces a gentle "slow network" message if a single navigation stalls.
 * Pauses while the app is backgrounded so UPI / wallet handoffs do not false-trigger.
 */
export function useWebViewLoadTimeout({ enabled, onSlowLoad }: UseWebViewLoadTimeoutOptions): {
  scheduleSlowLoadCheck: () => void;
  clearSlowLoadCheck: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const clearSlowLoadCheck = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleSlowLoadCheck = useCallback(() => {
    clearSlowLoadCheck();
    if (!enabled || appStateRef.current !== 'active') {
      return;
    }
    timerRef.current = setTimeout(() => {
      if (appStateRef.current === 'active') {
        onSlowLoad();
      }
    }, SLOW_LOAD_MS);
  }, [clearSlowLoadCheck, enabled, onSlowLoad]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      appStateRef.current = next;
      if (next !== 'active') {
        clearSlowLoadCheck();
      }
    });
    return () => {
      sub.remove();
      clearSlowLoadCheck();
    };
  }, [clearSlowLoadCheck]);

  return { scheduleSlowLoadCheck, clearSlowLoadCheck };
}

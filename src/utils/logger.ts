import clientConfig from '../../client.config.json';

/**
 * Dev-only logging. Release builds strip most `console` noise from Metro in typical setups;
 * keep all diagnostics behind `__DEV__` so production stays quiet and predictable.
 */
export function logInfo(message: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[${clientConfig.LOG_TAG}] ${message}`, data ?? '');
  }
}

export function logWarn(message: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    console.warn(`[${clientConfig.LOG_TAG}] ${message}`, data ?? '');
  }
}

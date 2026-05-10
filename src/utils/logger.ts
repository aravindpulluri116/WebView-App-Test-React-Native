/**
 * Dev-only logging. Release builds strip most `console` noise from Metro in typical setups;
 * keep all diagnostics behind `__DEV__` so production stays quiet and predictable.
 */
export function logInfo(message: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[Subhchandra] ${message}`, data ?? '');
  }
}

export function logWarn(message: string, data?: Record<string, unknown>): void {
  if (__DEV__) {
    console.warn(`[Subhchandra] ${message}`, data ?? '');
  }
}

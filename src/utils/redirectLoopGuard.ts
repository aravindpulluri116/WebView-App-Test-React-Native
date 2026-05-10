export type RedirectLoopGuard = {
  /** Call for allowed top-frame navigations before loading. */
  shouldAllowTopFrameUrl(url: string, now?: number): boolean;
  /** Reset after a full page finishes loading (successful load end). */
  resetAfterSuccessfulLoad(): void;
};

/**
 * Blocks runaway redirect chains that never reach a stable document (common misconfiguration / bad redirects).
 */
export function createRedirectLoopGuard(
  maxEventsInWindow: number,
  windowMs: number,
): RedirectLoopGuard {
  let windowStart = 0;
  let events: { url: string; t: number }[] = [];

  return {
    shouldAllowTopFrameUrl(url: string, now = Date.now()): boolean {
      if (now - windowStart > windowMs) {
        windowStart = now;
        events = [{ url, t: now }];
        return true;
      }

      events.push({ url, t: now });
      events = events.filter((e) => now - e.t <= windowMs);

      const sameUrlCount = events.filter((e) => e.url === url).length;
      if (sameUrlCount > maxEventsInWindow) {
        return false;
      }

      if (events.length > maxEventsInWindow * 2) {
        return false;
      }

      return true;
    },
    resetAfterSuccessfulLoad(): void {
      windowStart = 0;
      events = [];
    },
  };
}

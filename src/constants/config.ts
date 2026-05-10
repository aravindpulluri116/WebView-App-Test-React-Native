import clientConfig from '../../client.config.json';

const WEB_URL_DEFAULT = clientConfig.WEB_URL_DEFAULT;
export const APP_DISPLAY_NAME = clientConfig.APP_DISPLAY_NAME;
export const PAYMENT_HOST_PATTERNS = clientConfig.PAYMENT_HOST_PATTERNS as readonly string[];
export const AUTH_HOST_PATTERNS = clientConfig.AUTH_HOST_PATTERNS as readonly string[];

/**
 * Primary site URL: override with `EXPO_PUBLIC_WEB_URL` when bundling.
 */
function readWebUrl(): string {
  const raw =
    typeof process !== 'undefined' && typeof process.env !== 'undefined'
      ? process.env.EXPO_PUBLIC_WEB_URL?.trim()
      : undefined;
  if (!raw) {
    return WEB_URL_DEFAULT;
  }
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return WEB_URL_DEFAULT;
    }
    u.hash = '';
    if ((u.pathname === '/' || u.pathname === '') && !u.search) {
      return u.origin;
    }
    return u.toString();
  } catch {
    return WEB_URL_DEFAULT;
  }
}

/** First-party hosts for navigation (derived from `WEB_URL` + optional `www` / apex pair). */
function primaryHostsForUrl(webUrl: string): readonly string[] {
  try {
    const h = new URL(webUrl).hostname.toLowerCase();
    if (!h) {
      return ['localhost'];
    }
    if (h.startsWith('www.')) {
      const apex = h.slice(4);
      return apex ? [apex, h] : [h];
    }
    return [h, `www.${h}`];
  } catch {
    return ['localhost'];
  }
}

export const WEB_URL = readWebUrl();

export const PRIMARY_HOSTS = primaryHostsForUrl(WEB_URL) as readonly string[];

/**
 * Deep-link style schemes used by UPI / wallet apps (must leave the WebView).
 */
export const EXTERNAL_APP_SCHEMES = [
  'upi:',
  'phonepe:',
  'paytmmp:',
  'tez:',
  'gpay:',
  'bhim:',
  'amazonpay:',
  'credpay:',
] as const;

/** Matches `app.json` splash / shell background to reduce visible white flash. */
export const WEBVIEW_SURFACE_COLOR = '#fafafa' as const;

/**
 * react-native-webview origin whitelist (defense in depth; policy still enforced in JS).
 * @see https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md#originwhitelist
 */
export const WEBVIEW_ORIGIN_WHITELIST = [
  'http://*',
  'https://*',
  'about:*',
  'data:*',
  'blob:*',
] as const;

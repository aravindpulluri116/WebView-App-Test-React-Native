/**
 * Primary site loaded in the WebView.
 */
export const WEB_URL = 'https://www.subhchandraorganics.com' as const;

/** Shown in exit confirmation and system UI where relevant. */
export const APP_DISPLAY_NAME = 'Subhchandra Organics' as const;

/**
 * Hosts treated as first-party (stay inside the WebView).
 */
export const PRIMARY_HOSTS = ['subhchandraorganics.com', 'www.subhchandraorganics.com'] as const;

/**
 * Payment / wallet / issuer hosts allowed inside the WebView (checkout, redirects, 3DS, wallets).
 * Extend if your gateway adds new domains.
 */
export const PAYMENT_HOST_PATTERNS = [
  'razorpay.com',
  'razorpay.in',
  'rzp.io',
  'pay.google.com',
  'checkout.stripe.com',
  'js.stripe.com',
  'payu.in',
  'paytm.com',
  'phonepe.com',
  'npci.org.in',
] as const;

/** OAuth / issuer pages that must stay in-WebView when linked from checkout or login. */
export const AUTH_HOST_PATTERNS = ['accounts.google.com'] as const;

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

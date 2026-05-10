import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import {
  AUTH_HOST_PATTERNS,
  EXTERNAL_APP_SCHEMES,
  PAYMENT_HOST_PATTERNS,
  PRIMARY_HOSTS,
} from '../constants/config';
import { logWarn } from './logger';

export type NavigationResolution =
  | { kind: 'allowWebView' }
  | { kind: 'openExternal' }
  | { kind: 'block' };

function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function matchesHost(host: string, pattern: string): boolean {
  return host === pattern || host.endsWith(`.${pattern}`);
}

function isPrimaryHost(host: string): boolean {
  return PRIMARY_HOSTS.some((h) => matchesHost(host, h));
}

function isPaymentHost(host: string): boolean {
  return PAYMENT_HOST_PATTERNS.some((h) => matchesHost(host, h));
}

function isAuthHost(host: string): boolean {
  return AUTH_HOST_PATTERNS.some((h) => matchesHost(host, h));
}

function isExternalAppScheme(lower: string): boolean {
  return EXTERNAL_APP_SCHEMES.some((scheme) => lower.startsWith(scheme));
}

/**
 * Decide how to handle a navigation URL (top-frame, sub-resource, or new window).
 */
export function resolveNavigation(url: string): NavigationResolution {
  const trimmed = url.trim();
  if (!trimmed) {
    return { kind: 'block' };
  }

  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('about:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:')
  ) {
    return { kind: 'allowWebView' };
  }

  if (lower.startsWith('file:')) {
    return { kind: 'block' };
  }

  if (
    lower.startsWith('intent:') ||
    lower.startsWith('market:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('sms:') ||
    isExternalAppScheme(lower)
  ) {
    return { kind: 'openExternal' };
  }

  const host = hostnameOf(trimmed);
  if (!host) {
    return { kind: 'allowWebView' };
  }

  if (isPrimaryHost(host) || isPaymentHost(host) || isAuthHost(host)) {
    return { kind: 'allowWebView' };
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return { kind: 'openExternal' };
  }

  return { kind: 'block' };
}

/**
 * Opens payment intents in the handler app; uses Custom Tabs (via Expo) for http(s) when possible.
 */
export async function openExternalUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    try {
      await WebBrowser.openBrowserAsync(trimmed, {
        showInRecents: true,
        enableBarCollapsing: true,
      });
      return;
    } catch (err) {
      logWarn('Custom Tabs open failed, falling back to Linking', {
        url: trimmed,
        error: String(err),
      });
    }
  }

  try {
    await Linking.openURL(trimmed);
  } catch (err) {
    logWarn('Linking.openURL failed (wallet / intent may be unavailable)', {
      url: trimmed,
      error: String(err),
    });
  }
}

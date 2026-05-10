/**
 * Map WebView / network error strings to user-safe, non-technical copy.
 */
export function normalizeLoadError(raw: string | undefined): string {
  const text = (raw ?? '').toLowerCase();

  if (
    text.includes('ssl') ||
    text.includes('certificate') ||
    text.includes('cert authority') ||
    text.includes('handshake')
  ) {
    return 'Could not establish a secure connection. Check your network and try again.';
  }

  if (text.includes('timeout') || text.includes('timed out')) {
    return 'The connection timed out. Try again when you have a stronger signal.';
  }

  if (
    text.includes('network') ||
    text.includes('unreachable') ||
    text.includes('failed to connect') ||
    text.includes('connection refused')
  ) {
    return 'Network error. Check your connection and try again.';
  }

  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'The page could not be loaded.';
}

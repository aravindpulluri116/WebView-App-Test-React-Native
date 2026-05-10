import { WEBVIEW_SURFACE_COLOR } from '../constants/config';

/**
 * Runs before any document content loads — reduces white flash and sets a stable surface color.
 */
export const INJECT_BEFORE_CONTENT = `
(function () {
  try {
    var c = ${JSON.stringify(WEBVIEW_SURFACE_COLOR)};
    document.documentElement.style.backgroundColor = c;
    document.documentElement.style.colorScheme = 'light';
  } catch (e) {}
  true;
})();
`;

/**
 * Runs after load; optional polish without touching page logic.
 */
export const INJECT_AFTER_LOAD = `
(function () {
  try {
    document.documentElement.style.backgroundColor = ${JSON.stringify(WEBVIEW_SURFACE_COLOR)};
  } catch (e) {}
  true;
})();
`;

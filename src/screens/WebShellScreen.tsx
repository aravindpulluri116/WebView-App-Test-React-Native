import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewNavigation,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';

import { ErrorFallback } from '../components/ErrorFallback';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { OfflineScreen } from '../components/OfflineScreen';
import { WEB_URL, WEBVIEW_ORIGIN_WHITELIST, WEBVIEW_SURFACE_COLOR } from '../constants/config';
import { useAppResumeEffect } from '../hooks/useAppResumeEffect';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSplashScreen } from '../hooks/useSplashScreen';
import { useWebViewAndroidBackHandler } from '../hooks/useWebViewAndroidBackHandler';
import { useWebViewLoadTimeout } from '../hooks/useWebViewLoadTimeout';
import { normalizeLoadError } from '../utils/errorMessages';
import { INJECT_AFTER_LOAD, INJECT_BEFORE_CONTENT } from '../utils/injectedScript';
import { logWarn } from '../utils/logger';
import { openExternalUrl, resolveNavigation } from '../utils/navigationPolicy';
import { createRedirectLoopGuard } from '../utils/redirectLoopGuard';

const SLOW_LOAD_USER_MESSAGE =
  'This is taking longer than usual. Pull down to refresh or try again when your connection is stable.';

const redirectGuard = createRedirectLoopGuard(14, 5000);

/**
 * Main shell: WebView plus loading, offline, and error overlays.
 * `sourceUri` updates only for the initial URL and trusted new-window loads (e.g. checkout).
 */
export function WebShellScreen() {
  const webViewRef = useRef<WebView>(null);
  const wasOfflineRef = useRef(false);

  const [sourceUri, setSourceUri] = useState<string>(WEB_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { isOffline, recheck } = useNetworkStatus();
  const { initialLoadDone, hideSplashOnce } = useSplashScreen(isOffline);

  const originWhitelist = useMemo(() => [...WEBVIEW_ORIGIN_WHITELIST], []);

  const handleSlowLoad = useCallback(() => {
    setLoadError(SLOW_LOAD_USER_MESSAGE);
    hideSplashOnce();
  }, [hideSplashOnce]);

  const { scheduleSlowLoadCheck, clearSlowLoadCheck } = useWebViewLoadTimeout({
    enabled: !isOffline,
    onSlowLoad: handleSlowLoad,
  });

  useAppResumeEffect(
    useCallback(() => {
      setLoadError((prev) => (prev === SLOW_LOAD_USER_MESSAGE ? null : prev));
    }, []),
  );

  const handleRetryError = useCallback(() => {
    redirectGuard.resetAfterSuccessfulLoad();
    setLoadError(null);
    webViewRef.current?.reload();
  }, []);

  const handleGoBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  useWebViewAndroidBackHandler({
    canGoBack: !isOffline && canGoBack,
    onWebViewGoBack: handleGoBack,
  });

  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      redirectGuard.resetAfterSuccessfulLoad();
      setLoadError(null);
      webViewRef.current?.reload();
    }
    wasOfflineRef.current = isOffline;
  }, [isOffline]);

  const handleShouldStart = useCallback((event: ShouldStartLoadRequest): boolean => {
    const url = event.url;
    const decision = resolveNavigation(url);

    if (decision.kind === 'openExternal') {
      void openExternalUrl(url);
      return false;
    }
    if (decision.kind === 'block') {
      return false;
    }

    if (event.isTopFrame) {
      if (!redirectGuard.shouldAllowTopFrameUrl(url)) {
        logWarn('Blocked suspected redirect loop', { url });
        setLoadError('Too many redirects. Pull down to refresh or try again later.');
        return false;
      }
    }

    return true;
  }, []);

  const handleOpenWindow = useCallback((event: WebViewOpenWindowEvent) => {
    const targetUrl = event.nativeEvent.targetUrl;
    const decision = resolveNavigation(targetUrl);
    if (decision.kind === 'openExternal') {
      void openExternalUrl(targetUrl);
      return;
    }
    if (decision.kind === 'allowWebView') {
      setSourceUri(targetUrl);
    }
  }, []);

  const handleNavigationStateChange = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);

  const handleLoadStart = useCallback(() => {
    clearSlowLoadCheck();
    if (!isOffline) {
      setLoadError(null);
      scheduleSlowLoadCheck();
    }
  }, [clearSlowLoadCheck, isOffline, scheduleSlowLoadCheck]);

  const handleError = useCallback(
    (event: WebViewErrorEvent) => {
      clearSlowLoadCheck();
      const description = event.nativeEvent.description;
      setLoadError(normalizeLoadError(description));
      hideSplashOnce();
    },
    [clearSlowLoadCheck, hideSplashOnce],
  );

  const handleHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      const { statusCode } = event.nativeEvent;
      if (statusCode >= 500) {
        clearSlowLoadCheck();
        setLoadError(`The server returned an error (${statusCode}). Please try again.`);
        hideSplashOnce();
      }
    },
    [clearSlowLoadCheck, hideSplashOnce],
  );

  const handleLoadEnd = useCallback(() => {
    clearSlowLoadCheck();
    redirectGuard.resetAfterSuccessfulLoad();
    hideSplashOnce();
  }, [clearSlowLoadCheck, hideSplashOnce]);

  const handleRenderProcessGone = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  const showInitialLoader = !initialLoadDone && !loadError && !isOffline;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.fill}>
        <WebView
          ref={webViewRef}
          source={{ uri: sourceUri }}
          style={styles.webview}
          originWhitelist={originWhitelist}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          cacheMode="LOAD_DEFAULT"
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          setSupportMultipleWindows
          pullToRefreshEnabled
          mixedContentMode="compatibility"
          overScrollMode="content"
          injectedJavaScriptBeforeContentLoaded={INJECT_BEFORE_CONTENT}
          injectedJavaScript={INJECT_AFTER_LOAD}
          onShouldStartLoadWithRequest={handleShouldStart}
          onOpenWindow={handleOpenWindow}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleHttpError}
          onRenderProcessGone={handleRenderProcessGone}
        />
        <LoadingOverlay visible={showInitialLoader} />
        {loadError && !isOffline ? (
          <View style={styles.layer}>
            <ErrorFallback message={loadError} onRetry={handleRetryError} />
          </View>
        ) : null}
        {isOffline ? (
          <View style={styles.layer}>
            <OfflineScreen onRetry={recheck} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WEBVIEW_SURFACE_COLOR,
  },
  fill: {
    flex: 1,
    backgroundColor: WEBVIEW_SURFACE_COLOR,
  },
  webview: {
    flex: 1,
    backgroundColor: WEBVIEW_SURFACE_COLOR,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: WEBVIEW_SURFACE_COLOR,
  },
});

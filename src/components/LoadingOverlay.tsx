import { memo, useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet } from 'react-native';

import { WEBVIEW_SURFACE_COLOR } from '../constants/config';

type LoadingOverlayProps = {
  visible: boolean;
};

export const LoadingOverlay = memo(function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
    >
      <ActivityIndicator size="large" color="#2e7d32" />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WEBVIEW_SURFACE_COLOR,
  },
});

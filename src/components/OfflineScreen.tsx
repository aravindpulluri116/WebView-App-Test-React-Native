import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { WEBVIEW_SURFACE_COLOR } from '../constants/config';

type OfflineScreenProps = {
  onRetry: () => void;
};

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You are offline</Text>
      <Text style={styles.body}>Check your connection and try again.</Text>
      <TouchableOpacity style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonLabel}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: WEBVIEW_SURFACE_COLOR,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

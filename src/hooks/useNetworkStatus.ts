import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

function computeOffline(state: NetInfoState): boolean {
  if (state.isConnected === false) {
    return true;
  }
  if (state.isConnected === true && state.isInternetReachable === false) {
    return true;
  }
  return false;
}

export type NetworkStatus = {
  isOffline: boolean;
  recheck: () => void;
};

/**
 * Tracks connectivity for a full-screen offline state.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOffline, setIsOffline] = useState(false);

  const recheck = useCallback(() => {
    void NetInfo.refresh().then((state) => {
      setIsOffline(computeOffline(state));
    });
  }, []);

  useEffect(() => {
    let active = true;

    void NetInfo.fetch().then((state) => {
      if (active) {
        setIsOffline(computeOffline(state));
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(computeOffline(state));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { isOffline, recheck };
}

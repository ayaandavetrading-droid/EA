import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseScreenWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  requestLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
  toggleLock: () => Promise<boolean>;
  error: string | null;
}

/**
 * Hook to keep the device screen awake during active trading sessions.
 * Automatically restores normal screen behavior when released or on unmount.
 * Re-acquires the lock if document visibility changes back to visible.
 */
export function useScreenWakeLock(autoEnableOnMount = false): UseScreenWakeLockReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const shouldBeActiveRef = useRef<boolean>(autoEnableOnMount);

  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    setIsSupported(supported);
  }, []);

  const releaseLock = useCallback(async () => {
    shouldBeActiveRef.current = false;
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        console.warn('WakeLock release error:', err);
      } finally {
        sentinelRef.current = null;
        setIsActive(false);
      }
    } else {
      setIsActive(false);
    }
  }, []);

  const requestLock = useCallback(async (): Promise<boolean> => {
    shouldBeActiveRef.current = true;
    setError(null);

    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      setError('Screen Wake Lock is not supported on this browser/platform.');
      return false;
    }

    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        setIsActive(true);
        return true;
      }

      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener('release', () => {
        // If the system released it unexpectedly (e.g. low battery), update state
        if (!shouldBeActiveRef.current) {
          setIsActive(false);
          sentinelRef.current = null;
        }
      });

      return true;
    } catch (err: any) {
      console.warn('Screen WakeLock request error:', err);
      setError(err?.message || 'Failed to acquire Screen Wake Lock.');
      setIsActive(false);
      return false;
    }
  }, []);

  const toggleLock = useCallback(async (): Promise<boolean> => {
    if (isActive) {
      await releaseLock();
      return false;
    } else {
      return await requestLock();
    }
  }, [isActive, releaseLock, requestLock]);

  // Handle visibility changes: browsers automatically release wakeLock on tab backgrounding
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldBeActiveRef.current) {
        // Re-request wake lock when returning to foreground
        await requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requestLock]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    requestLock,
    releaseLock,
    toggleLock,
    error,
  };
}

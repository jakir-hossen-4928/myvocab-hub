import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export type AppPlatform = 'web' | 'android';

export interface PlatformInfo {
  isNative: boolean;
  platform: AppPlatform;
  isTouchDevice: boolean;
}

const getPlatform = (): AppPlatform => {
  try {
    if (Capacitor.isNativePlatform()) return 'android';
  } catch (e) {
    // Not running inside Capacitor — fall through to web
  }
  return 'web';
};

export const usePlatform = (): PlatformInfo => {
  const [platform, setPlatform] = useState<AppPlatform>(() => getPlatform());

  useEffect(() => {
    // Re-evaluate in case the Capacitor bridge was injected after mount (dev only).
    setPlatform(getPlatform());
  }, []);

  const isTouchDevice =
    typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);

  return {
    isNative: platform !== 'web',
    platform,
    isTouchDevice,
  };
};
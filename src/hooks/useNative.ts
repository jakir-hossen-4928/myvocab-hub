import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Native bridge hook.
 *
 * Three environments are supported transparently:
 *  1. Native Android app (Capacitor) — uses official @capacitor/* plugins.
 *  2. Despia native wrapper (legacy) — uses the despia dispatch bridge.
 *  3. Web browser — graceful no-ops / Web Share API fallback.
 */
export const useNative = () => {
    const [isNative, setIsNative] = useState(false);
    const isCapacitor = Capacitor.isNativePlatform();

    useEffect(() => {
        if (isCapacitor) {
            setIsNative(true);
            return;
        }

        // Check for legacy Despia native environment
        const isDespiaUserAgent = navigator.userAgent.includes('despia');
        const urlParams = new URLSearchParams(window.location.search);
        const isDebug = urlParams.get('native_debug') === 'true';
        setIsNative(isDespiaUserAgent || isDebug);
    }, [isCapacitor]);

    const haptic = useCallback((type: 'light' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
        if (isCapacitor) {
            import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
                const styleMap = {
                    light: ImpactStyle.Light,
                    heavy: ImpactStyle.Heavy,
                    success: ImpactStyle.Medium,
                    warning: ImpactStyle.Medium,
                    error: ImpactStyle.Medium,
                };
                const style = styleMap[type] ?? ImpactStyle.Light;
                void Haptics.impact({ style }).catch(() => {});
            });
            return;
        }
        if (!isNative) return;
        nativeCommand(`haptic://${type}`);
    }, [isNative, isCapacitor]);

    const setStatusBarColor = useCallback((colorHex: string) => {
        if (isCapacitor) {
            import('@capacitor/status-bar').then(({ StatusBar }) => {
                void StatusBar.setBackgroundColor({ color: colorHex }).catch(() => {});
            });
            return;
        }
        if (!isNative) return;

        // Legacy despia bridge: convert hex to rgb
        const hex = colorHex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        nativeCommand(`statusbarcolor://{${r}, ${g}, ${b}}`);
    }, [isNative, isCapacitor]);

    const share = useCallback((options: { title?: string; message?: string; url?: string }) => {
        if (isCapacitor) {
            import('@capacitor/share').then(({ Share }) => {
                void Share.share({ title: options.title, text: options.message, url: options.url }).catch(() => {});
            }).catch(() => {});
            return;
        }

        // Web Share API fallback
        if (navigator.share) {
            navigator.share({
                title: options.title,
                text: options.message,
                url: options.url,
            }).catch(console.error);
            return;
        }

        nativeCommand(
            `shareapp://?message=${encodeURIComponent(options.message ?? '')}&url=${encodeURIComponent(options.url ?? '')}`,
        );
    }, [isNative, isCapacitor]);

    const showSpinner = useCallback(() => {
        if (!isNative) return;
        nativeCommand('spinneron://');
    }, [isNative]);

    const hideSpinner = useCallback(() => {
        if (!isNative) return;
        nativeCommand('spinneroff://');
    }, [isNative]);

    /** Low-level despia bridge dispatcher (web/despia only). */
    const nativeCommand = (command: string) => {
        if (typeof window !== 'undefined' && (window as any).despia) {
            try {
                (window as any).despia(command);
            } catch (e) {
                console.error('Native command failed:', e);
            }
        } else {
            console.log(`📱 [Native Mock] Executing: ${command}`);
        }
    };

    return {
        isNative,
        haptic,
        setStatusBarColor,
        share,
        showSpinner,
        hideSpinner,
        isCapacitor,
    };
};
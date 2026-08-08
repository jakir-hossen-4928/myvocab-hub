import { useCallback, useEffect, useState } from 'react';
import { fetchVersionManifest, isVersionNewer } from '@/utils/appUpdate';
import { APP_VERSION, VERSION_MANIFEST_URL } from '@/version';

export interface AppUpdateState {
    /** True while the version manifest is being checked. */
    checking: boolean;
    /** True when a newer version has been found (BEFORE dismissal). */
    available: boolean;
    /** Latest version string reported by the manifest. */
    latestVersion: string | null;
    /** APK download URL (opened in the device browser). */
    apkDownloadUrl: string | null;
    /** Release notes for the pending update. */
    releaseNotes?: string;
    /** Always shown error diagnostic (non-blocking). */
    error: string | null;
}

const initialState: AppUpdateState = {
    checking: true,
    available: false,
    latestVersion: null,
    apkDownloadUrl: null,
    error: null,
};

/**
 * Checks for app updates on native Android. On web this is a no-op.
 *
 * To publish a new APK release:
 * 1. Bump APP_VERSION in src/version.ts (and versionName/versionCode in android/app/build.gradle)
 * 2. Build: npm run cap:build:android
 * 3. Upload the APK to your host so apkDownloadUrl resolves
 * 4. Update public/version.json { latestVersion, apkDownloadUrl, releaseNotes } and deploy the site
 */
export const useAppUpdate = (enabled = true) => {
    const [state, setState] = useState<AppUpdateState>(initialState);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        const check = async () => {
            try {
                const manifest = await fetchVersionManifest(VERSION_MANIFEST_URL);
                if (cancelled) return;
                if (isVersionNewer(APP_VERSION, manifest.latestVersion)) {
                    setState({
                        checking: false,
                        available: true,
                        latestVersion: manifest.latestVersion,
                        apkDownloadUrl: manifest.apkDownloadUrl,
                        releaseNotes: manifest.releaseNotes,
                        error: null,
                    });
                } else {
                    setState({ ...initialState, checking: false, available: false });
                }
            } catch (err) {
                if (cancelled) return;
                console.warn('[AppUpdate] Update check failed (offline or unreachable):', err);
                setState({ ...initialState, checking: false, error: 'Update check unavailable' });
            }
        };

        check();
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    /** Opens the APK in the device browser for direct download. */
    const openUpdate = useCallback(() => {
        if (!state.apkDownloadUrl) return;
        // Dynamically import so the Capacitor plugin is code-split out of the web bundle.
        import('@capacitor/browser')
            .then(({ Browser }) => Browser.open({ url: state.apkDownloadUrl ?? '' }))
            .catch(() => {
                window.open(state.apkDownloadUrl ?? '', '_blank');
            });
    }, [state.apkDownloadUrl]);

    /** Lets the user keep using the app; the banner reappears next launch. */
    const dismiss = useCallback(() => setDismissed(true), []);

    const show = !dismissed && state.available;

    return {
        ...state,
        show,
        dismiss,
        openUpdate,
    };
};
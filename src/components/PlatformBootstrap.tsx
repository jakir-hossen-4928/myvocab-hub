import { useEffect } from "react";
import { usePlatform } from "@/hooks/usePlatform";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { UpdateAvailable } from "@/components/UpdateAvailable";

/**
 * Native Android bootstrap:
 *  - hides the splash screen once the web app is ready
 *  - runs the in-app update check and renders the update banner
 *  - configures status bar styling
 *
 * On web this component renders nothing.
 */
export const PlatformBootstrap = () => {
    const { isNative } = usePlatform();
    const update = useAppUpdate(isNative);

    useEffect(() => {
        if (!isNative) return;

        let cancelled = false;

        // Hide the native splash as soon as the React tree is up.
        import("@capacitor/splash-screen")
            .then(({ SplashScreen }) => SplashScreen.hide())
            .catch(() => {});

        // Back button → background the app (native Android convention).
        import("@capacitor/app")
            .then(({ App }) => {
                App.addListener("backButton", ({ canGoBack }) => {
                    if (canGoBack) {
                        window.history.back();
                    } else {
                        App.exitApp();
                    }
                });
            })
            .catch(() => {});

        return () => {
            import("@capacitor/app").then(({ App }) => App.removeAllListeners()).catch(() => {});
        };
    }, [isNative]);

    if (!isNative) return null;

    return (
        <UpdateAvailable
            show={update.show}
            latestVersion={update.latestVersion}
            apkDownloadUrl={update.apkDownloadUrl}
            releaseNotes={update.releaseNotes}
            onDownload={update.openUpdate}
            onDismiss={update.dismiss}
        />
    );
};
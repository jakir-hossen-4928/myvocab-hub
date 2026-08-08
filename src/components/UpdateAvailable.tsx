import { X, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatform } from "@/hooks/usePlatform";

interface UpdateAvailableProps {
    show: boolean;
    latestVersion: string | null;
    apkDownloadUrl: string | null;
    releaseNotes?: string;
    onDownload: () => void;
    onDismiss: () => void;
}

/**
 * Update prompt shown inside the native Android app when a newer APK
 * release is available. On web this component is never mounted.
 */
export const UpdateAvailable = ({
    show,
    latestVersion,
    releaseNotes,
    onDownload,
    onDismiss,
}: UpdateAvailableProps) => {
    const { isNative } = usePlatform();

    if (!isNative) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 80 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-24 left-3 right-3 z-[70] mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-2xl"
                    role="dialog"
                    aria-label="Update available"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Download className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-bold text-foreground">
                                    Update available
                                    {latestVersion && (
                                        <span className="ml-1.5 text-xs font-semibold text-primary">
                                            v{latestVersion}
                                        </span>
                                    )}
                                </h3>
                                <button
                                    onClick={onDismiss}
                                    aria-label="Close update prompt"
                                    className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            {releaseNotes && (
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                                    <Sparkles className="mr-1 inline h-3 w-3" />
                                    {releaseNotes}
                                </p>
                            )}
                            <div className="mt-3 flex gap-2">
                                <Button
                                    size="sm"
                                    className="h-11 flex-1 text-sm font-bold"
                                    onClick={onDownload}
                                >
                                    <Download className="mr-1.5 h-4 w-4" />
                                    Download Update
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-11 text-sm"
                                    onClick={onDismiss}
                                >
                                    Later
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const isNativeSharePlatform = () => Capacitor.isNativePlatform();

/**
 * Share a PNG (rendered with html-to-image) via the OS share sheet.
 * - Native (Capacitor): writes the PNG to the Cache dir, then shares the file URI.
 * - Web: uses the Web Share API with a File; falls back to downloading the PNG.
 */
export const sharePng = async (
  dataUrl: string,
  fileName: string,
  title: string,
  message: string
): Promise<{ success?: boolean; copied?: boolean; downloaded?: boolean; error?: unknown }> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Strip the data:image/png;base64, header before writing base64 to disk
      const base64Data = dataUrl.split(',')[1] || dataUrl;
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({
        title,
        text: message,
        url: result.uri,
        dialogTitle: 'Share Card',
      });
      return { success: true };
    }

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text: message });
      return { success: true };
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { downloaded: true };
  } catch (error) {
    console.error('Image share failed:', error);
    return { error };
  }
};

/**
 * Share plain text via the OS share sheet (no image).
 * - Native: Capacitor Share.
 * - Web: Web Share API, else copy to clipboard.
 */
export const shareText = async (title: string, text: string, url?: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, url, dialogTitle: 'Share' });
      return { success: true };
    }
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return { success: true };
    }
    await navigator.clipboard.writeText(url || text);
    return { copied: true };
  } catch (error) {
    console.error('Share failed:', error);
    return { error };
  }
};
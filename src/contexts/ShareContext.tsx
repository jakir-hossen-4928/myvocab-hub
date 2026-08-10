import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Vocabulary } from '@/types/vocabulary';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { sharePng } from '@/services/nativeShareService';
import { trackEvent as trackUTMEvent, getStoredUTMParams } from '@/utils/utmTracking';

interface ShareContextType {
    shareAsImage: (item: Vocabulary) => Promise<void>;
    sharingId: string | null;
    itemToShare: Vocabulary | null;
    shareRef: React.RefObject<HTMLDivElement>;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const shareRef = useRef<HTMLDivElement>(null);
    const [sharingId, setSharingId] = useState<string | null>(null);
    const [itemToShare, setItemToShare] = useState<Vocabulary | null>(null);

    const shareAsImage = useCallback(async (item: Vocabulary) => {
        if (sharingId) return;

        // Track share modal open
        trackUTMEvent('share_modal_open', getStoredUTMParams(), {
            vocabulary_id: item.id,
            vocabulary_english: item.english,
            vocabulary_bangla: item.bangla
        });

        setItemToShare(item);
        setSharingId(item.id);

        // Wait for state update and render
        setTimeout(async () => {
            try {
                if (!shareRef.current) {
                    throw new Error('Capture element not found');
                }

                // Small delay to ensure render is settled and fonts are loaded
                await new Promise(resolve => setTimeout(resolve, 500));

                const dataUrl = await toPng(shareRef.current, {
                    cacheBust: true,
                    pixelRatio: 2,
                    skipAutoScale: true,
                    fontEmbedCSS: '',
                    backgroundColor: 'white',
                    style: { opacity: '1', transform: 'none', left: '0', top: '0', pointerEvents: 'auto' },
                    filter: (node) => node.tagName !== 'LINK',
                });
                if (dataUrl.length < 1000) console.warn('Generated sharing image seems too small/empty');

                const fileName = `vocabulary-${item.english.toLowerCase().replace(/\s+/g, '-')}.png`;
                const title = `Vocabulary: ${item.english}`;
                const text = `Check out this word: ${item.english} (${item.bangla})`;

                const result = await sharePng(dataUrl, fileName, title, text);

                if (result.error) {
                    throw result.error instanceof Error ? result.error : new Error(String(result.error));
                }

                if (result.downloaded) {
                    toast.success('Sharing not supported. Image downloaded instead.');
                } else {
                    // Track successful share
                    trackUTMEvent('share_completed', getStoredUTMParams(), {
                        vocabulary_id: item.id,
                        share_method: 'native_share'
                    });
                }
            } catch (error) {
                console.error('Error sharing image:', error);
                toast.error('Failed to generate sharing image. Please try again.');

                // Track share error
                trackUTMEvent('share_error', getStoredUTMParams(), {
                    vocabulary_id: item.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            } finally {
                setSharingId(null);
                setItemToShare(null);
            }
        }, 150);
    }, [sharingId]);

    return (
        <ShareContext.Provider value={{ shareAsImage, sharingId, itemToShare, shareRef }}>
            {children}
        </ShareContext.Provider>
    );
};

export const useShare = () => {
    const context = useContext(ShareContext);
    if (context === undefined) {
        throw new Error('useShare must be used within a ShareProvider');
    }
    return context;
};

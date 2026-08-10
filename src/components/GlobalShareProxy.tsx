import React from 'react';
import { useShare } from '@/contexts/ShareContext';
import { ShareableVocabularyCard } from './ShareableVocabularyCard';

export const GlobalShareProxy: React.FC = () => {
    const { itemToShare, shareRef } = useShare();

    if (!itemToShare) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '0',
                left: '0',
                opacity: 0,
                pointerEvents: 'none',
                width: '450px',
                zIndex: -1,
                overflow: 'hidden',
                backgroundColor: 'white',
                visibility: 'visible',
            }}
        >
            <ShareableVocabularyCard ref={shareRef} item={itemToShare} />
        </div>
    );
};

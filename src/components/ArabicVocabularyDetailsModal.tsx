import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Heart, Edit, ChevronLeft, ChevronRight, Share2, Loader2, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { speakText } from "@/services/ttsService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import type { ArabicVocabulary } from "@/types/arabicVocabulary";
import { getCategoryById } from "@/data/saudiCategories";
import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { showSuccessToast, showErrorToast } from "@/utils/sweetAlert";
import { useNative } from "@/hooks/useNative";

interface ArabicVocabularyDetailsModalProps {
    vocabulary: ArabicVocabulary | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    isAdmin?: boolean;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

export function ArabicVocabularyDetailsModal({
    vocabulary,
    open,
    onOpenChange,
    isFavorite = false,
    onToggleFavorite,
    isAdmin = false,
    onNext,
    onPrevious,
    hasNext = false,
    hasPrevious = false,
}: ArabicVocabularyDetailsModalProps) {
    const navigate = useNavigate();
    const { haptic } = useNative();
    const [modalShareRef, setModalShareRef] = useState<HTMLDivElement | null>(null);
    const [itemToShare, setItemToShare] = useState<ArabicVocabulary | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    if (!vocabulary) return null;

    const category = getCategoryById(vocabulary.category);

    const handleShare = () => {
        if (isSharing) return;
        haptic('light');

        setIsSharing(true);
        setItemToShare(vocabulary);

        setTimeout(async () => {
            try {
                if (!modalShareRef) throw new Error('Capture element not found');
                await new Promise(resolve => setTimeout(resolve, 500));

                const dataUrl = await toPng(modalShareRef, {
                    cacheBust: true,
                    pixelRatio: 2,
                    skipAutoScale: true,
                    fontEmbedCSS: '',
                });

                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const fileName = `arabic-vocabulary-${(vocabulary.arabic || vocabulary.transliteration || 'word').toLowerCase().replace(/\s+/g, '-')}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Arabic Vocabulary: ${vocabulary.arabic}`,
                        text: `Check out this Arabic word: ${vocabulary.arabic} (${vocabulary.bangla})`,
                    });
                } else {
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showSuccessToast("Sharing not supported. Image downloaded instead.");
                }
            } catch (error) {
                console.error("Error sharing image:", error);
                showErrorToast("Failed to generate sharing image. Please try again.");
            } finally {
                setIsSharing(false);
                setItemToShare(null);
            }
        }, 150);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-none shadow-2xl">
                {/* Navigation Buttons - Desktop */}
                {(hasPrevious || hasNext) && (
                    <>
                        {hasPrevious && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onPrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-background/50 hover:bg-emerald-600 hover:text-white border border-muted-foreground/20 hover:border-emerald-600 shadow-md backdrop-blur-sm hidden sm:flex transition-all duration-300"
                                aria-label="Previous Arabic word"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                        )}
                        {hasNext && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-background/50 hover:bg-emerald-600 hover:text-white border border-muted-foreground/20 hover:border-emerald-600 shadow-md backdrop-blur-sm hidden sm:flex transition-all duration-300"
                                aria-label="Next Arabic word"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        )}
                    </>
                )}

                <ScrollArea className="flex-1 h-full [&>[data-radix-scroll-area-viewport]]:!overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="py-6 px-6 sm:px-20 space-y-8 pb-20">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/20 -mx-6 sm:-mx-20 -mt-6 p-8 sm:px-20 border-b relative">
                            {/* Action Buttons */}
                            <div className="absolute top-4 right-12 flex gap-2">
                                {onToggleFavorite && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggleFavorite(vocabulary.id)}
                                        className="h-9 w-9 rounded-full bg-background/50 hover:bg-background shadow-sm backdrop-blur-sm"
                                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        <Heart className={`h-5 w-5 ${isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleShare}
                                    className="h-9 w-9 rounded-full bg-background/50 hover:bg-background shadow-sm backdrop-blur-sm"
                                    title="Share as Image"
                                    disabled={isSharing}
                                >
                                    {isSharing ? (
                                        <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
                                    ) : (
                                        <Share2 className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </Button>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => navigate(`/admin/arabic-vocabularies/edit/${vocabulary.id}`)}
                                        className="h-9 w-9 rounded-full bg-background/50 hover:bg-background shadow-sm backdrop-blur-sm"
                                        title="Edit"
                                    >
                                        <Edit className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>

                            {/* Mobile Navigation - Top */}
                            {(hasPrevious || hasNext) && (
                                <div className="flex sm:hidden justify-between items-center mb-4 -mt-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onPrevious}
                                        disabled={!hasPrevious}
                                        className={`h-8 w-8 rounded-full ${!hasPrevious ? 'opacity-0' : ''}`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground font-medium">Swipe to navigate</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onNext}
                                        disabled={!hasNext}
                                        className={`h-8 w-8 rounded-full ${!hasNext ? 'opacity-0' : ''}`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Badge className="text-sm px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-600/90 shadow-sm">
                                            {category.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground font-mono bg-background/60 px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm" dir="rtl">
                                            {category.arabic}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <DialogDescription className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                        বাংলা অর্থ · Meaning
                                    </DialogDescription>
                                    <DialogTitle className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                                        {vocabulary.bangla}
                                    </DialogTitle>
                                    <div className="space-y-1">
                                        <DialogDescription className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                            Answer · العربية
                                        </DialogDescription>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <DialogDescription className="text-3xl sm:text-4xl font-black text-emerald-600 leading-tight" dir="rtl">
                                                {vocabulary.arabic}
                                            </DialogDescription>
                                            <DialogDescription className="text-base sm:text-lg font-semibold text-muted-foreground font-mono">
                                                {vocabulary.transliteration}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    {vocabulary.english && (
                                        <DialogDescription className="text-base sm:text-lg font-medium text-foreground/70">
                                            {vocabulary.english}
                                        </DialogDescription>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); speakText(vocabulary.arabic); }}
                                        className="h-10 w-10 text-muted-foreground hover:text-emerald-600 rounded-full hover:bg-emerald-500/10 transition-colors"
                                        title="Listen"
                                    >
                                        <Volume2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Arabic word - answer */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/80">
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
                                    <Volume2 className="h-4 w-4" />
                                </div>
                                العربية — Answer
                            </h3>
                            <Card className="p-5 bg-muted/30 border-none shadow-sm">
                                <p className="text-2xl font-black text-foreground/90 break-words" dir="rtl">
                                    {vocabulary.arabic}
                                </p>
                                {vocabulary.transliteration && (
                                    <p className="mt-1 text-base font-medium text-muted-foreground font-mono">
                                        {vocabulary.transliteration}
                                    </p>
                                )}
                            </Card>
                        </div>

                        {/* English meaning */}
                        {vocabulary.english && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/80">
                                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    English
                                </h3>
                                <Card className="p-5 bg-muted/30 border-none shadow-sm">
                                    <p className="text-lg font-bold text-foreground/90 break-words">
                                        {vocabulary.english}
                                    </p>
                                </Card>
                            </div>
                        )}

                        {/* Example */}
                        {vocabulary.example && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/80">
                                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500">
                                        <Volume2 className="h-4 w-4" />
                                    </div>
                                    Example
                                </h3>
                                <Card className="p-5 bg-background border relative group">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => speakText(vocabulary.example!)}
                                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-emerald-600 rounded-full hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Listen"
                                    >
                                        <Volume2 className="h-3 w-3" />
                                    </Button>
                                    <p className="text-lg font-semibold leading-relaxed text-foreground/90 break-words" dir="rtl">
                                        "{vocabulary.example}"
                                    </p>
                                    {vocabulary.exampleBangla && (
                                        <p className="mt-2 text-sm text-muted-foreground break-words">
                                            {vocabulary.exampleBangla}
                                        </p>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Hidden view for sharing as image */}
                {itemToShare && (
                    <div
                        style={{
                            position: 'fixed',
                            left: '0',
                            top: '0',
                            width: '450px',
                            opacity: '0',
                            pointerEvents: 'none',
                            zIndex: -1,
                            overflow: 'hidden',
                            backgroundColor: 'white',
                        }}
                    >
                        <div ref={setModalShareRef}>
                            {/* Share card */}
                            <div style={{ padding: '24px', borderRadius: '24px', fontFamily: 'inherit', color: '#1f2937' }} className="bg-white border border-emerald-100 shadow-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-emerald-600 p-2 rounded-xl">
                                        <Globe className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xl font-bold text-emerald-600 tracking-tight">MyVocab Hub</span>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
                                    <Badge variant="secondary" className="px-4 py-1 text-sm bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase tracking-widest rounded-full">
                                        {category.label}
                                    </Badge>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">বাংলা অর্থ</p>
                                    <h1 className="text-4xl font-black text-gray-900 leading-tight">
                                        {itemToShare.bangla}
                                    </h1>
                                    <h2 className="text-3xl font-black text-emerald-700 leading-tight" dir="rtl">{itemToShare.arabic}</h2>
                                    <p className="text-base text-emerald-600 font-semibold font-mono">{itemToShare.transliteration}</p>
                                </div>
                                <div className="space-y-4">
                                    {itemToShare.english && (
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">English</p>
                                            <p className="text-lg font-semibold text-emerald-600">{itemToShare.english}</p>
                                        </div>
                                    )}
                                    {itemToShare.example && (
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Example</p>
                                            <p className="text-base font-medium text-gray-800 leading-relaxed" dir="rtl">"{itemToShare.example}"</p>
                                            {itemToShare.exampleBangla && (
                                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{itemToShare.exampleBangla}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/60 rounded-full border border-emerald-100/60">
                                        <Globe className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[10px] items-center text-gray-400 font-medium tracking-wide">
                                            Learn more at <span className="text-emerald-500 font-bold ml-1">myvocab-hub.netlify.app</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
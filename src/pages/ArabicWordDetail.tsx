import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Volume2, Trash2, Heart, Loader2, Edit, Share2, ArrowRight, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useArabicVocabularies, useArabicVocabularyMutations } from "@/hooks/useArabicVocabularies";
import type { ArabicVocabulary } from "@/types/arabicVocabulary";
import { speakText } from "@/services/ttsService";
import { useFavorites } from "@/hooks/useFavorites";
import { useNative } from "@/hooks/useNative";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipe } from "@/hooks/useSwipe";
import { confirmAction, showSuccessToast, showErrorToast } from "@/utils/sweetAlert";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { getCategoryById } from "@/data/saudiCategories";
import { toPng } from "html-to-image";
import { sharePng } from "@/services/nativeShareService";

const SwipeHint = ({ onDismiss }: { onDismiss: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onAnimationComplete={() => setTimeout(onDismiss, 2500)}
    className="fixed bottom-8 left-0 right-0 pointer-events-none z-50 flex justify-center pb-4"
  >
    <div className="bg-black/60 text-white px-6 py-2 rounded-full flex items-center gap-3 backdrop-blur-md shadow-lg">
      <ArrowLeft className="w-4 h-4 animate-pulse" />
      <span className="text-xs font-medium">Swipe to navigate</span>
      <ArrowRight className="w-4 h-4 animate-pulse" />
    </div>
  </motion.div>
);

const ShareableArabicCard = ({ item }: { item: ArabicVocabulary }) => (
  <div
    style={{
      backgroundColor: '#ffffff',
      width: '450px',
      padding: '24px',
      borderRadius: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#1f2937',
    }}
    className="shadow-2xl border border-emerald-100 bg-white"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="bg-emerald-600 p-2 rounded-xl">
        <Globe className="w-6 h-6 text-white" />
      </div>
      <span className="text-xl font-bold text-emerald-600 tracking-tight">MyVocab Hub</span>
    </div>

    <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
      <Badge variant="secondary" className="px-4 py-1 text-sm bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase tracking-widest rounded-full">
        {getCategoryById(item.category).label}
      </Badge>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">বাংলা অর্থ</p>
      <h1 className="text-4xl font-black text-gray-900 leading-tight">
        {item.bangla}
      </h1>
      <h2 className="text-3xl font-black text-emerald-700 leading-tight" dir="rtl">{item.arabic}</h2>
      <p className="text-base text-emerald-600 font-semibold font-mono">{item.transliteration}</p>
    </div>

    <div className="space-y-4">
      {item.english && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">English</p>
          <p className="text-lg font-semibold text-emerald-600">{item.english}</p>
        </div>
      )}
      {item.example && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Example</p>
          <p className="text-base font-medium text-gray-800 leading-relaxed" dir="rtl">"{item.example}"</p>
          {item.exampleBangla && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.exampleBangla}</p>
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
);

export default function ArabicWordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: vocabularies = [], isLoading } = useArabicVocabularies();
  const { deleteVocabulary } = useArabicVocabularyMutations();
  const { favorites, toggleFavorite: toggleFav, isFavorite: checkIsFavorite } = useFavorites();
  const { haptic } = useNative();
  const isMobile = useIsMobile();

  const word = vocabularies.find((v) => v.id === id);
  const isFavorite = id ? checkIsFavorite(id) : false;

  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const shareRef = useRef<HTMLDivElement | null>(null);
  const [itemToShare, setItemToShare] = useState<ArabicVocabulary | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const handleSwipeLeft = () => {
    const currentIndex = vocabularies.findIndex(v => v.id === id);
    if (currentIndex !== -1 && currentIndex < vocabularies.length - 1) {
      setSlideDirection('right');
      navigate(`/arabic-vocabularies/${vocabularies[currentIndex + 1].id}`);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = vocabularies.findIndex(v => v.id === id);
    if (currentIndex > 0) {
      setSlideDirection('left');
      navigate(`/arabic-vocabularies/${vocabularies[currentIndex - 1].id}`);
    }
  };

  const swipeHandlers = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const containerProps = isMobile ? swipeHandlers : {};

  const toggleFavorite = () => {
    if (!id) return;
    haptic('light');
    toggleFav(id);
    showSuccessToast(isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!word || isSharing) return;
    haptic('light');

    setIsSharing(true);
    setItemToShare(word);

    setTimeout(async () => {
      try {
        if (!shareRef.current) throw new Error('Capture element not found');
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

        const fileName = `arabic-vocabulary-${(word.arabic || word.transliteration || 'word').toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-')}.png`;
        const result = await sharePng(
          dataUrl,
          fileName,
          `Arabic Vocabulary: ${word.arabic}`,
          `Check out this Arabic word: ${word.arabic} (${word.bangla})`
        );

        if (result.error) {
          throw result.error instanceof Error ? result.error : new Error(String(result.error));
        }

        if (result.downloaded) {
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

  const handleDelete = async () => {
    if (!id || !isAdmin) return;

    const isConfirmed = await confirmAction(
      'Are you sure?',
      "You won't be able to revert this!",
      'Yes, delete it!'
    );

    if (isConfirmed) {
      setIsDeleting(true);
      try {
        await deleteVocabulary.mutateAsync(id);
        showSuccessToast('Arabic word has been deleted.');
        navigate("/arabic-vocabularies");
      } catch (error) {
        console.error("Failed to delete:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading && vocabularies.length === 0) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-4xl font-black">العربية</p>
        <p className="text-xl font-bold">Word not found</p>
        <Button onClick={() => navigate("/arabic-vocabularies")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
        </Button>
      </div>
    );
  }

  const category = getCategoryById(word.category);

  return (
    <div className="min-h-screen bg-background pb-8 overflow-hidden" {...containerProps}>
      <Helmet>
        <title>{word.arabic} - {word.bangla} | MyVocab Hub</title>
      </Helmet>

      <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
        <motion.div
          key={id}
          custom={slideDirection}
          initial={{ x: slideDirection === 'right' ? 300 : -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: slideDirection === 'right' ? -300 : 300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full"
        >
          <header className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white px-4 pt-8 pb-16">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="text-white hover:bg-white/10"
                    title="Share as Image"
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Share2 className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    className="text-white hover:bg-white/10"
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/arabic-vocabularies/edit/${word.id}`)}
                        className="text-white hover:bg-white/10"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="text-white hover:bg-white/10"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2"
                  >
                    বাংলা অর্থ · Meaning
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl sm:text-5xl font-black leading-none mb-4 break-words"
                  >
                    {word.bangla}
                  </motion.h1>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-3"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">
                      Answer · العربية
                    </p>
                    <p className="text-3xl sm:text-4xl font-black leading-tight break-words" dir="rtl">
                      {word.arabic}
                    </p>
                    <p className="text-lg font-medium text-white/80 mt-1 break-words">
                      {word.transliteration}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-3 flex-wrap"
                  >
                    <Badge className="bg-white/20 text-white border-0">
                      {category.label}
                    </Badge>
                    {word.english && (
                      <span className="text-sm text-white/80">{word.english}</span>
                    )}
                  </motion.div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakText(word.arabic)}
                  className="text-white hover:bg-white/10 flex-shrink-0"
                >
                  <Volume2 className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </header>

          <div className="max-w-2xl mx-auto px-4 -mt-6 space-y-4 relative z-10">
            {/* Arabic word = answer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6 shadow-hover">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-foreground">العربية — Answer</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => speakText(word.arabic)}
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-2xl font-black text-primary break-words" dir="rtl">{word.arabic}</p>
                <p className="text-base font-medium text-muted-foreground mt-1 break-words">{word.transliteration}</p>
              </Card>
            </motion.div>

            {/* Bangla meaning = prompt */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Card className="p-6 bg-emerald-50/40 dark:bg-emerald-500/5 shadow-hover">
                <h2 className="font-semibold text-foreground mb-2">বাংলা অর্থ</h2>
                <p className="text-2xl font-black text-foreground break-words">{word.bangla}</p>
              </Card>
            </motion.div>

            {/* English meaning */}
            {word.english && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="p-6 shadow-hover">
                  <h2 className="font-semibold text-foreground mb-2">English</h2>
                  <p className="text-lg font-bold text-primary break-words">{word.english}</p>
                </Card>
              </motion.div>
            )}

            {/* Example */}
            {word.example && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <Card className="p-6 shadow-card">
                  <h2 className="font-semibold text-foreground mb-3">Example</h2>
                  <div className="border-r-2 border-accent pr-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => speakText(word.example)}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                      <p className="text-lg font-semibold leading-relaxed flex-1 break-words" dir="rtl">
                        {word.example}
                      </p>
                    </div>
                    {word.exampleBangla && (
                      <p className="mt-2 text-muted-foreground break-words">{word.exampleBangla}</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Next word */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <NextWord vocab={vocabularies} currentId={word.id} />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {isMobile && showSwipeHint && (
        <AnimatePresence>
          <SwipeHint onDismiss={() => setShowSwipeHint(false)} />
        </AnimatePresence>
      )}

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
            backgroundColor: 'white'
          }}
        >
          <div ref={shareRef}>
            <ShareableArabicCard item={itemToShare} />
          </div>
        </div>
      )}
    </div>
  );
}

const NextWord = ({ vocab, currentId }: { vocab: ArabicVocabulary[]; currentId: string }) => {
  const navigate = useNavigate();
  const nextIndex = vocab.findIndex((v) => v.id === currentId) + 1;
  const next = vocab[nextIndex] || vocab[0];
  if (!next) return null;
  return (
    <button
      onClick={() => navigate(`/arabic-vocabularies/${next.id}`)}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/60 hover:bg-muted transition-colors border border-border/60"
    >
      <div className="text-left">
        <p className="text-xs font-medium text-muted-foreground">Next word</p>
        <p className="font-bold text-emerald-700 dark:text-emerald-400">{next.bangla}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black break-words" dir="rtl">{next.arabic}</p>
        <p className="font-mono text-sm text-muted-foreground">{next.transliteration}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
};
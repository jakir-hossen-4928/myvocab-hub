import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Volume2, X, ListFilter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useArabicVocabularies } from "@/hooks/useArabicVocabularies";
import { SAUDI_CATEGORIES, getCategoryById } from "@/data/saudiCategories";
import { speakText } from "@/services/ttsService";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import type { ArabicVocabulary } from "@/types/arabicVocabulary";
import { ArabicVocabularyDetailsModal } from "@/components/ArabicVocabularyDetailsModal";
import { useViewPreference } from "@/hooks/useViewPreference";
import { ViewPreferenceDialog } from "@/components/ViewPreferenceDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNative } from "@/hooks/useNative";

const WordCardSkeleton = () => (
  <Card className="p-5 rounded-2xl h-full">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="h-4 w-32 rounded mb-2" />
    <Skeleton className="h-5 w-20 rounded mb-4" />
    <div className="border-t pt-3">
      <Skeleton className="h-3 w-full rounded" />
    </div>
  </Card>
);

export default function ArabicVocabularies() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "");
  const { data: vocabularies = [], isLoading } = useArabicVocabularies(searchQuery);

  // View preference + modal state (mirrors English Vocabularies)
  const { preference, savePreference, clearPreference } = useViewPreference();
  const [showPreferenceDialog, setShowPreferenceDialog] = useState(false);
  const [selectedWord, setSelectedWord] = useState<ArabicVocabulary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { favorites, toggleFavorite } = useFavorites();
  const { haptic } = useNative();

  const handleWordClick = (word: ArabicVocabulary) => {
    if (isMobile) {
      navigate(`/arabic-vocabularies/${word.id}`);
      return;
    }

    if (!preference) {
      setSelectedWord(word);
      setShowPreferenceDialog(true);
    } else if (preference === "modal") {
      setSelectedWord(word);
      setIsModalOpen(true);
    } else {
      navigate(`/arabic-vocabularies/${word.id}`);
    }
  };

  const handlePreferenceSelect = (pref: "modal" | "page") => {
    savePreference(pref);
    setShowPreferenceDialog(false);

    if (selectedWord) {
      if (pref === "modal") {
        setIsModalOpen(true);
      } else {
        navigate(`/arabic-vocabularies/${selectedWord.id}`);
        setSelectedWord(null);
      }
    }
  };

  // Sync selectedWord with updated data from hook
  useEffect(() => {
    if (selectedWord && vocabularies.length > 0) {
      const updated = vocabularies.find(v => v.id === selectedWord.id);
      if (updated && updated !== selectedWord) {
        setSelectedWord(updated);
      }
    }
  }, [vocabularies, selectedWord]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: vocabularies.length };
    for (const v of vocabularies) {
      const cat = getCategoryById(v.category).id;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [vocabularies]);

  const filtered = useMemo(() => {
    if (!activeCategory) return vocabularies;
    return vocabularies.filter((v) => getCategoryById(v.category).id === activeCategory);
  }, [vocabularies, activeCategory]);

  const selectedCategory = useMemo(
    () => SAUDI_CATEGORIES.find((c) => c.id === activeCategory) || null,
    [activeCategory]
  );

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams);
    if (cat) params.set("category", cat);
    else params.delete("category");
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Arabic Vocabulary | MyVocab Hub</title>
        <meta name="description" content="Learn Saudi Arabic vocabulary with Bengali translations and transliterations." />
      </Helmet>

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white px-4 pt-6 pb-10 sm:pt-8 sm:pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="hidden sm:flex items-center justify-between gap-3 mb-4 flex-wrap">
            <Badge className="bg-white/20 text-white border-0 font-bold tracking-wider uppercase text-[10px]">
              🇸🇦 Saudi Dialect
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-1 sm:mb-2" dir="rtl">
            المفردات العربية
          </h1>
          <p className="hidden sm:block text-white/80 font-medium text-sm sm:text-base">
            Learn Arabic (Saudi style) with daily words - transliteration & Bangla meaning
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-6 sm:-mt-8">
        {/* Search & Category filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Arabic word, transliteration, or Bangla meaning..."
              className="pl-10 h-12 rounded-2xl bg-card border-border shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Category dropdown */}
          <div className="relative w-full sm:w-[240px] shrink-0">
            <Select
              value={activeCategory || "all"}
              onValueChange={(val) => handleCategory(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl bg-card border-border shadow-lg font-bold text-sm px-3">
                <SelectValue aria-hidden="true" className="sr-only" />
                <ListFilter className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
                <span className="truncate flex-1 text-left">
                  {selectedCategory
                    ? `${selectedCategory.label} (${categoryCounts[selectedCategory.id] || 0})`
                    : "সবগুলো ক্যাটাগরি"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  সবগুলো ({categoryCounts.all || 0})
                </SelectItem>
                {SAUDI_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <SelectItem key={cat.id} value={cat.id} className="pr-8 py-2">
                      <span className="flex items-center justify-between gap-3 flex-wrap w-full">
                        <span>
                          {cat.label} ({count})
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal" dir="rtl">
                          {cat.transliteration}
                        </span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Word list */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <WordCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-4 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/20">
            <div className="text-4xl font-black">العربية</div>
            <p className="text-xl font-bold">No Arabic words found</p>
            <p className="text-sm text-center px-6">
              {searchQuery ? "Try adjusting your search." : "Add your first Arabic word to begin learning!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((vocab, index) => {
              return (
                <motion.div
                  key={vocab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                >
                  <Card
                    onClick={() => handleWordClick(vocab)}
                    className="group cursor-pointer p-5 hover:shadow-xl hover:border-emerald-300 transition-all rounded-2xl h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-relaxed break-words">
                          {vocab.bangla}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakText(vocab.arabic); }}
                        className="text-muted-foreground hover:text-emerald-600 transition-colors flex-shrink-0 ml-2"
                        aria-label="Listen"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-foreground leading-none mb-1 break-words" dir="rtl">
                      {vocab.arabic}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground/60 mb-2">{vocab.transliteration}</p>
                    {vocab.example && (
                      <p className="text-xs text-muted-foreground break-words border-t pt-2 mt-2" dir="rtl">
                        {vocab.example}
                      </p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ViewPreferenceDialog
        open={showPreferenceDialog}
        onSelect={handlePreferenceSelect}
      />

      <ArabicVocabularyDetailsModal
        vocabulary={selectedWord}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        isFavorite={selectedWord ? favorites.includes(selectedWord.id) : false}
        onToggleFavorite={(id) => {
          haptic('light');
          toggleFavorite(id);
        }}
        isAdmin={isAdmin}
        onNext={() => {
          const currentIndex = vocabularies.findIndex(v => v.id === selectedWord?.id);
          if (currentIndex !== -1 && currentIndex < vocabularies.length - 1) {
            setSelectedWord(vocabularies[currentIndex + 1]);
          }
        }}
        onPrevious={() => {
          const currentIndex = vocabularies.findIndex(v => v.id === selectedWord?.id);
          if (currentIndex > 0) {
            setSelectedWord(vocabularies[currentIndex - 1]);
          }
        }}
        hasNext={selectedWord ? vocabularies.findIndex(v => v.id === selectedWord.id) !== -1 && vocabularies.findIndex(v => v.id === selectedWord.id) < vocabularies.length - 1 : false}
        hasPrevious={selectedWord ? vocabularies.findIndex(v => v.id === selectedWord.id) > 0 : false}
      />
    </div>
  );
}
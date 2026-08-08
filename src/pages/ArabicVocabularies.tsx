import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Volume2, X } from "lucide-react";
import { useArabicVocabularies } from "@/hooks/useArabicVocabularies";
import { SAUDI_CATEGORIES, getCategoryById } from "@/data/saudiCategories";
import { speakText } from "@/services/ttsService";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

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
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white px-4 pt-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <Badge className="bg-white/20 text-white border-0 font-bold tracking-wider uppercase text-[10px]">
              🇸🇦 Saudi Dialect
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2" dir="rtl">
            المفردات العربية
          </h1>
          <p className="text-white/80 font-medium text-sm sm:text-base">
            Learn Arabic (Saudi style) with daily words - transliteration & Bangla meaning
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Search & Add */}
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
          {isAdmin && (
            <Button onClick={() => navigate("/admin/arabic-vocabularies/add")} className="h-12 rounded-2xl font-bold shadow-lg">
              <Plus className="mr-2 h-5 w-5" /> Add Word
            </Button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-thin">
          <button
            onClick={() => handleCategory("")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
              !activeCategory
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-card text-muted-foreground border-border hover:border-emerald-400"
            }`}
          >
            সবগুলো ({categoryCounts.all || 0})
          </button>
          {SAUDI_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  activeCategory === cat.id
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-card text-muted-foreground border-border hover:border-emerald-400"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
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
                    onClick={() => navigate(`/arabic-vocabularies/${vocab.id}`)}
                    className="group cursor-pointer p-5 hover:shadow-xl hover:border-emerald-300 transition-all rounded-2xl h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl sm:text-3xl font-black text-foreground leading-none" dir="rtl">
                        {vocab.arabic}
                      </h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); speakText(vocab.arabic); }}
                        className="text-muted-foreground hover:text-emerald-600 transition-colors"
                        aria-label="Listen"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground/60 mb-1">{vocab.transliteration}</p>
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mb-2">{vocab.bangla}</p>
                    {vocab.example && (
                      <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2 mt-2" dir="rtl">
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
    </div>
  );
}
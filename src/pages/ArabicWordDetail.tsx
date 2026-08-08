import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Volume2, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useArabicVocabularies, useArabicVocabularyMutations } from "@/hooks/useArabicVocabularies";
import type { ArabicVocabulary } from "@/types/arabicVocabulary";
import { speakText } from "@/services/ttsService";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function ArabicWordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: vocabularies = [], isLoading } = useArabicVocabularies();
  const { deleteVocabulary } = useArabicVocabularyMutations();
  const word = vocabularies.find((v) => v.id === id);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isAdmin || !word) return;
    if (!window.confirm("Are you sure you want to delete this Arabic word?")) return;
    setIsDeleting(true);
    try {
      await deleteVocabulary.mutateAsync(word.id!);
      navigate("/arabic-vocabularies");
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
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

  const example = word.example || "لا يوجد مثال بعد";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>{word.arabic} - {word.bangla} | MyVocab Hub</title>
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={() => navigate("/arabic-vocabularies")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <LanguageSwitcher compact />
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/arabic-vocabularies/${word.id}/edit`)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Main card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8 rounded-3xl shadow-lg border-border/60">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <h1 className="text-5xl sm:text-6xl font-black leading-none" dir="rtl">
                {word.arabic}
              </h1>
              <p className="font-mono text-lg text-muted-foreground">{word.transliteration}</p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => speakText(word.arabic)}
                className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center transition-colors"
                aria-label="Listen to pronunciation"
              >
                <Volume2 className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-2xl p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">বাংলা অর্থ</p>
                <p className="text-2xl font-black">{word.bangla}</p>
              </div>
              {word.english && (
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">English</p>
                  <p className="text-lg font-bold text-primary">{word.english}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Example */}
        {word.example && (
          <Card className="mt-6 p-6 rounded-3xl border-dashed">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Example</p>
            <p className="text-lg font-semibold leading-relaxed" dir="rtl">{word.example}</p>
            {word.exampleBangla && <p className="mt-2 text-muted-foreground">{word.exampleBangla}</p>}
          </Card>
        )}

        {/* Related next word */}
        <div className="mt-8">
          <RelatedWord vocabularies={vocabularies} currentId={word.id} />
        </div>
      </div>
    </div>
  );
}

const RelatedWord = ({ vocabularies, currentId }: { vocabularies: ArabicVocabulary[]; currentId: string }) => {
  const navigate = useNavigate();
  const nextIndex = vocabularies.findIndex((v) => v.id === currentId) + 1;
  const next = vocabularies[nextIndex] || vocabularies[0];
  if (!next) return null;
  return (
    <button
      onClick={() => navigate(`/arabic-vocabularies/${next.id}`)}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/60 hover:bg-muted transition-colors border border-border/60"
    >
      <div className="text-left">
        <p className="text-xs font-medium text-muted-foreground">Next word</p>
        <p className="font-mono font-bold">{next.transliteration}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black" dir="rtl">{next.arabic}</p>
        <p className="font-bold text-emerald-700 dark:text-emerald-400">{next.bangla}</p>
      </div>
      <ArrowLeft className="rotate-180 h-5 w-5 text-muted-foreground" />
    </button>
  );
};
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, RotateCcw, Flame, CheckCircle2, XCircle,
  Sparkles, Volume2, Languages, Trophy, BookOpen
} from "lucide-react";
import { useVocabularies } from "@/hooks/useVocabularies";
import { useArabicVocabularies } from "@/hooks/useArabicVocabularies";
import { speakText } from "@/services/ttsService";
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";

type Mode = "flashcards" | "quiz";
type LanguageMode = "english" | "arabic";

interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  transliteration?: string;
  isArabic: boolean;
}

const STREAK_KEY = "study_streak";
const PROGRESS_KEY = "study_progress";

interface StoredStreak {
  lastActive: string;
  count: number;
}

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const loadStreak = (): StoredStreak => {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"count":0,"lastActive":""}');
  } catch {
    return { count: 0, lastActive: "" };
  }
};

const recordStreak = (): StoredStreak => {
  const today = getTodayKey();
  const stored = loadStreak();
  if (stored.lastActive === today) return stored;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = stored.lastActive === yesterday ? stored.count + 1 : 1;
  const next = { count, lastActive: today };
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
};

interface ProgressState {
  reviewed: string[];
  counts: Record<string, number>;
  correct: Record<string, number>;
}

const loadProgress = (): ProgressState => {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return raw[getTodayKey()] || { reviewed: [], counts: {}, correct: {} };
  } catch {
    return { reviewed: [], counts: {}, correct: {} };
  }
};

const saveProgress = (state: ProgressState) => {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    raw[getTodayKey()] = state;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(raw));
  } catch {
    // ignore
  }
};

export default function Study() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("flashcards");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("english");
  const [streak, setStreak] = useState<StoredStreak>(loadStreak);
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  const { data: englishWords = [], isLoading: loadingEnglish } = useVocabularies();
  const { data: arabicWords = [], isLoading: loadingArabic } = useArabicVocabularies();

  useEffect(() => {
    const s = recordStreak();
    setStreak(s);
  }, []);

  const cards = useMemo<FlashcardItem[]>(() => {
    if (languageMode === "arabic") {
      return arabicWords.map((w) => ({
        id: w.id as string,
        front: w.arabic,
        back: w.bangla,
        transliteration: w.transliteration,
        isArabic: true,
      }));
    }
    return englishWords.map((w) => ({
      id: w.id as string,
      front: w.english,
      back: w.bangla,
      isArabic: false,
    }));
  }, [englishWords, arabicWords, languageMode]);

  const isLoading = loadingEnglish || loadingArabic;

  const markReviewed = (id: string, wasCorrect: boolean, isForeign: boolean) => {
    setProgress((prev) => {
      const reviewed = prev.reviewed.includes(id) ? prev.reviewed : [...prev.reviewed, id];
      const counts = { ...prev.counts, [id]: (prev.counts[id] || 0) + 1 };
      const correct = {
        ...prev.correct,
        [id]: (prev.correct[id] || 0) + (wasCorrect ? 1 : 0),
      };
      const next = { reviewed, counts, correct };
      saveProgress(next);
      return next;
    });
    if (isForeign) {
      speakText(cards.find((c) => c.id === id)?.front || "");
    }
  };

  const reviewedToday = progress.reviewed.length;
  const cardsStudiedTotal = Object.keys(progress.counts).length;
  const accuracy = useMemo(() => {
    const total = Object.values(progress.correct).reduce((a, b) => a + b, 0);
    const reviewedCount = Object.values(progress.counts).reduce((a, b) => a + b, 0);
    return reviewedCount === 0 ? 0 : Math.round((total / reviewedCount) * 100);
  }, [progress]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground animate-pulse">
        Loading study material...
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-xl font-bold">
          {languageMode === "arabic" ? "No Arabic words yet" : "No vocabulary yet"}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {languageMode === "arabic"
            ? "Add Arabic words from the Arabic vocabulary page to start studying."
            : "Add some vocabulary words to start studying."}
        </p>
        <Button
          onClick={() =>
            navigate(languageMode === "arabic" ? "/arabic-vocabularies" : "/vocabularies")
          }
        >
          Browse vocabulary
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Study | MyVocab Hub</title>
      </Helmet>

      <div className="bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 text-white px-4 pt-8 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/15 text-white border-0">
                <Languages className="h-3 w-3 mr-1" /> English · العربية
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-white/15">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Study Center</h1>
          </div>
          <p className="text-white/80 font-medium text-sm sm:text-base">
            Reinforce your vocabulary with flashcards and quizzes
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-7">
        {/* Modes */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Badge
            variant="outline"
            onClick={() => setMode("flashcards")}
            className={cn(
              "cursor-pointer select-none px-4 py-2 text-sm font-bold rounded-full border-2 transition-all",
              mode === "flashcards"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Flashcards
          </Badge>
          <Badge
            variant="outline"
            onClick={() => setMode("quiz")}
            className={cn(
              "cursor-pointer select-none px-4 py-2 text-sm font-bold rounded-full border-2 transition-all",
              mode === "quiz"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}
          >
            Quiz
          </Badge>
          <div className="flex-1" />
          <select
            value={languageMode}
            onChange={(e) => setLanguageMode(e.target.value as LanguageMode)}
            className="h-9 rounded-full border border-border bg-card px-3 text-sm font-bold text-muted-foreground focus:outline-none"
          >
            <option value="english">English</option>
            <option value="arabic">العربية</option>
          </select>
        </div>

        {/* Streak + Stats */}
        <Card className="p-5 mb-6 rounded-2xl border-border/60">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-black">{streak.count}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Day Streak</p>
            </div>
            <div className="text-center border-l border-r border-border/60">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-black">{reviewedToday}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Reviewed Today</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-black">{accountAccuracy()}%</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Accuracy</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span className="font-semibold">Daily Goal</span>
              <span className="font-bold">
                {Math.min(reviewedToday, 20)}/20
              </span>
            </div>
            <Progress value={Math.min((reviewedToday / 20) * 100, 100)} className="h-2.5" />
          </div>
        </Card>

        {/* Main study area */}
        {mode === "flashcards" ? (
          <FlashcardDeck
            cards={cards}
            languageMode={languageMode}
            onReview={markReviewed}
          />
        ) : (
          <QuizPanel
            cards={cards}
            languageMode={languageMode}
            onReview={markReviewed}
          />
        )}
      </div>
    </div>
  );
}

const accountAccuracy = () => {
  const progress = loadProgress();
  const total = Object.values(progress.counts).reduce((a, b) => a + b, 0);
  const correct = Object.values(progress.correct).reduce((a, b) => a + b, 0);
  return total === 0 ? 0 : Math.round((correct / total) * 100);
};

const FlashcardDeck = ({
  cards,
  languageMode,
  onReview,
}: {
  cards: FlashcardItem[];
  languageMode: LanguageMode;
  onReview: (id: string, wasCorrect: boolean, isForeign: boolean) => void;
}) => {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return null;
  const card = cards[current % cards.length];

  const next = () => {
    setFlipped(false);
    setCurrent((prev) => (prev + 1) % cards.length);
  };

  return (
    <div className="space-y-4">
      <div className="relative cursor-pointer select-none" onClick={() => setFlipped(!flipped)}>
        <Card
          className={cn(
            "min-h-[240px] flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl border-border/70 transition-transform duration-300",
            flipped && "rotate-1 scale-[1.02]"
          )}
        >
          {!flipped ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Word {current + 1} / {cards.length}
              </p>
              <h2
                className="text-4xl sm:text-5xl font-black text-foreground text-center leading-tight"
                dir={languageMode === "arabic" ? "rtl" : "ltr"}
              >
                {card.front}
              </h2>
              {card.transliteration && (
                <p className="mt-3 font-mono text-muted-foreground">{card.transliteration}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4">
                Meaning
              </p>
              <p className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 text-center leading-tight">
                {card.back}
              </p>
            </>
          )}
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">Tap the card to flip</p>

      <div className="flex items-center justify-between gap-3">
        {card.isArabic && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => speakText(card.front)}
            className="text-muted-foreground hover:text-emerald-600"
            title="Listen"
          >
            <Volume2 className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="lg" onClick={() => { onReview(card.id, true, card.isArabic); next(); }}>
          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> Got It
        </Button>
        <Button variant="outline" size="lg" onClick={() => { onReview(card.id, false, card.isArabic); next(); }}>
          <XCircle className="h-4 w-4 mr-2 text-rose-500" /> Again
        </Button>
      </div>
    </div>
  );
};

const QuizPanel = ({
  cards,
  languageMode,
  onReview,
}: {
  cards: FlashcardItem[];
  languageMode: LanguageMode;
  onReview: (card: string, wasCorrect: boolean, isForeign: boolean) => void;
}) => {
  const [questionSet, setQuestionSet] = useState<FlashcardItem[]>(() =>
    shuffle([...cards]).slice(0, 10)
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questionSet[index];

  const options = useMemo(() => {
    if (!q) return [];
    const set = new Set<string>();
    set.add(q.back);
    while (set.size < 4 && set.size < cards.length) {
      const random = cards[Math.floor(Math.random() * cards.length)];
      set.add(random.back);
    }
    return [...set].sort(() => Math.random() - 0.5);
  }, [q, cards]);

  const restart = () => {
    setQuestionSet(shuffle([...cards]).slice(0, 10));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (cards.length < 4) {
    return (
      <Card className="p-10 text-center rounded-3xl">
        <p className="text-lg font-bold mb-2">Quiz needs at least 4 words</p>
        <p className="text-sm text-muted-foreground">Add more vocabulary to unlock the quiz.</p>
      </Card>
    );
  }

  if (done) {
    const pct = Math.round((score / questionSet.length) * 100);
    return (
      <Card className="p-10 text-center rounded-3xl">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-amber-500" />
        <h3 className="text-2xl font-black mb-2">
          {pct >= 80 ? "Excellent!" : pct >= 50 ? "Good job!" : "Keep practicing!"}
        </h3>
        <p className="text-4xl font-black text-primary mb-1">
          {score} / {questionSet.length}
        </p>
        <p className="text-sm text-muted-foreground mb-6">Accuracy: {pct}%</p>
        <Button size="lg" onClick={restart}>
          <RotateCcw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </Card>
    );
  }

  const isForeign = q.isArabic;

  const pick = (option: string) => {
    if (selected) return;
    setSelected(option);
    const correct = option === q.back;
    if (correct) setScore((s) => s + 1);
    onReview(q.id, correct, isForeign);
  };

  const nextQuestion = () => {
    if (index + 1 >= questionSet.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-muted-foreground">
          Question {index + 1} of {questionSet.length}
        </p>
        <Progress
          value={((index + (selected ? 1 : 0)) / questionSet.length) * 100}
          className="h-2 flex-1 mx-4"
        />
        <span className="text-sm font-black text-primary">{score} ✓</span>
      </div>

      <Card className="p-8 rounded-3xl border-border/70">
        <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Languages className="h-3.5 w-3.5" /> What is the Bangla meaning?
        </div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <h3
            className="text-4xl sm:text-5xl font-black text-center leading-tight"
            dir={languageMode === "arabic" ? "rtl" : "ltr"}
          >
            {q.front}
          </h3>
          {isForeign && (
            <button
              onClick={() => speakText(q.front)}
              className="text-muted-foreground hover:text-emerald-600"
              aria-label="Listen"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {options.map((option) => {
            const isAnswer = option === q.back;
            const isChosen = selected === option;
            return (
              <button
                key={option}
                onClick={() => pick(option)}
                disabled={!!selected}
                className={cn(
                  "text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-semibold transition-all",
                  !selected && "bg-card border-border hover:border-primary/40 hover:bg-primary/5",
                  selected && isAnswer && "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10",
                  selected && isChosen && !isAnswer && "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-500/10",
                  selected && !isChosen && !isAnswer && "opacity-60 border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  {isChosen && (isAnswer ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />)}
                  {option}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <div className="flex justify-end">
          <Button size="lg" onClick={nextQuestion}>
            {index + 1 >= questionSet.length ? "See Results" : "Next Question"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
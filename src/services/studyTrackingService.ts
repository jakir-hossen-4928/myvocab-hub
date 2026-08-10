import { dexieService, FlashcardProgress } from "@/lib/dexieDb";

export type StudyMode = "flashcards" | "quiz";
export type LanguageMode = "english" | "arabic";

export interface StudyCardRef {
    id: string;
    isArabic: boolean;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

const SESSION_KEY = "study_session_state_v2";
const SESSION_TTL_MS = 30 * 60 * 1000;

interface SessionState {
    updatedAt: number;
    index: number;
    queue: string[];
}

type SessionStore = Record<string, SessionState>;

const sessionKeyOf = (mode: StudyMode, language: LanguageMode) => `${language}:${mode}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

export const studyTrackingService = {
    /**
     * Load every per-word study record from Dexie.
     */
    async loadAll(): Promise<Map<string, FlashcardProgress>> {
        const records = await dexieService.getAllFlashcardProgress();
        return new Map(records.map(r => [r.id, r]));
    },

    /**
     * Record a single answer (flashcard "Got It/Again" or one quiz question).
     * Uses a simple spaced-repetition scheduler so words become due again later.
     */
    async recordReview(
        id: string,
        mode: StudyMode,
        correct: boolean,
        language: LanguageMode
    ): Promise<FlashcardProgress> {
        const now = Date.now();
        const current = await dexieService.getFlashcardProgress(id);

        const reviewCount = (current?.reviewCount || 0) + 1;
        const correctCount = (current?.correctCount || 0) + (correct ? 1 : 0);
        const incorrectCount = (current?.incorrectCount || 0) + (correct ? 0 : 1);
        const flashcardCount = (current?.flashcardCount || 0) + (mode === "flashcards" ? 1 : 0);
        const quizCount = (current?.quizCount || 0) + (mode === "quiz" ? 1 : 0);
        const quizCorrect = (current?.quizCorrect || 0) + (mode === "quiz" && correct ? 1 : 0);

        const correctStreak = correct
            ? (current?.correctStreak || 0) + 1
            : 0;
        const maxCorrectStreak = Math.max(correctStreak, current?.maxCorrectStreak || 0);

        // Spaced repetition (SM-2-like): interval (days) grows on success, resets on failure
        const baseInterval = current?.interval || 0;
        const interval = correct
            ? baseInterval === 0 ? 1 : Math.min(Math.round(baseInterval * 2.5), 90)
            : 0;
        const easeFactor = correct
            ? Math.max(1.3, (current?.easeFactor || 2.5) + (0.1 - (0.05 * (baseInterval === 0 ? 0 : 1))))
            : 1.3;
        const nextReviewDate = correct ? now + interval * DAY_MS : now + DAY_MS;

        // Confidence 0..5 based on accuracy + current streak
        const accuracy = reviewCount === 0 ? 0 : correctCount / reviewCount;
        const confidence = Math.min(5, Math.max(0, Math.round(accuracy * 3 + (correctStreak >= 3 ? 2 : 0))));

        const record: FlashcardProgress = {
            id,
            lastReviewed: now,
            reviewCount,
            correctCount,
            incorrectCount,
            easeFactor: Number(easeFactor.toFixed(2)),
            nextReviewDate,
            interval,
            streak: correctStreak,
            flashcardCount,
            quizCount,
            quizCorrect,
            correctStreak,
            maxCorrectStreak,
            lastResult: correct ? "correct" : "incorrect",
            confidence,
        };

        await dexieService.saveFlashcardProgress(record);
        return record;
    },

    /**
     * Order cards so due + weak words are surfaced first while keeping ones the
     * user has never touched shuffled in. Deterministic within a session.
     */
    buildQueue(
        cards: StudyCardRef[],
        records: Map<string, FlashcardProgress>
    ): string[] {
        const now = Date.now();

        const untouched = cards.filter(c => !records.has(c.id));
        const due = cards.filter(c => {
            const r = records.get(c.id);
            return r && r.nextReviewDate <= now;
        });
        const reviewed = cards.filter(c => {
            const r = records.get(c.id);
            return r && r.nextReviewDate > now;
        });

        // Shuffle undisturbed order for variety
        const heap = (arr: StudyCardRef[]) => [...arr].sort(() => Math.random() - 0.5);

        // Weakest (recently wrong / low confidence) lean toward the front of the "reviewed" group
        const sortedReviewed = heap(reviewed).sort((a, b) => {
            const ra = records.get(a.id)!;
            const rb = records.get(b.id)!;
            if (ra.confidence !== rb.confidence) return ra.confidence - rb.confidence;
            return ra.lastReviewed - rb.lastReviewed;
        });

        return [
            ...heap(untouched).map(c => c.id),
            ...heap(due).map(c => c.id),
            ...sortedReviewed.map(c => c.id),
        ];
    },

    /**
     * Best-effort resume position for a study session (mode + language).
     * Returns null when expired / missing / queue no longer valid.
     */
    loadSession(mode: StudyMode, language: LanguageMode): { index: number; queue: string[] } | null {
        const store = safeParse<SessionStore>(localStorage.getItem(SESSION_KEY), {});
        const session = store[sessionKeyOf(mode, language)];
        if (!session) return null;
        if (Date.now() - session.updatedAt > SESSION_TTL_MS) return null;
        if (!Array.isArray(session.queue) || session.queue.length === 0) return null;
        const safeIndex = Math.min(Math.max(0, session.index || 0), session.queue.length - 1);
        return { index: safeIndex, queue: session.queue };
    },

    saveSession(mode: StudyMode, language: LanguageMode, index: number, queue: string[]) {
        const store = safeParse<SessionStore>(localStorage.getItem(SESSION_KEY), {});
        store[sessionKeyOf(mode, language)] = { updatedAt: Date.now(), index, queue };
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(store));
        } catch {
            // storage full/unavailable — ignore
        }
    },

    clearSession(mode: StudyMode, language: LanguageMode) {
        const store = safeParse<SessionStore>(localStorage.getItem(SESSION_KEY), {});
        delete store[sessionKeyOf(mode, language)];
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(store));
        } catch {
            // ignore
        }
    },
};
import { dexieService } from "@/lib/dexieDb";
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

const isNativePlatform = Capacitor.isNativePlatform();

const PREFERRED_VOICE_KEY = 'tts_voice_preference';
const PREFERRED_RATE_KEY = 'tts_rate_preference';
const PREFERRED_PITCH_KEY = 'tts_pitch_preference';

let voicesCache: SpeechSynthesisVoice[] = [];

// Detect the language script of the text to pick the right voice
const detectLang = (text: string): string => {
  if (!text) return 'en-US';
  // Arabic script range: U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) return 'ar';
  // Bengali script range: U+0980–U+09FF
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  return 'en';
};

const isArabicVoice = (voice: SpeechSynthesisVoice) =>
  !!voice.lang && voice.lang.toLowerCase().startsWith('ar');

// Map the detected script language to a full BCP-47 tag for the TTS engine
const langToTag = (lang: string): string =>
  lang === 'ar' ? 'ar-SA' : lang === 'bn' ? 'bn-BD' : 'en-US';

const findVoice = (lang: string, preferredName: string | null): SpeechSynthesisVoice | null => {
  const prefix = lang.split('-')[0].toLowerCase();

  // 1. Explicit user preference
  if (preferredName) {
    const preferred = voicesCache.find(v => v.name === preferredName);
    if (preferred) return preferred;
  }

  // For Arabic, prioritize any ar-* voice over everything else
  const target = (v: SpeechSynthesisVoice) =>
    prefix === 'ar' ? isArabicVoice(v) : v.lang.toLowerCase().startsWith(prefix);

  // 2. Local (offline) voice matching the target language — critical for offline TTS
  const local = voicesCache.find(v => v.localService && target(v));
  if (local) return local;

  // 3. Any voice matching the target language
  const any = voicesCache.find(target);
  if (any) return any;

  // 4. Arabic last resort: any Arabic voice (handles `ar-XX` variants robustly)
  if (prefix === 'ar') {
    const fallback = voicesCache.find(isArabicVoice);
    if (fallback) return fallback;
  }

  return null;
};

export const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (isNativePlatform) {
    return TextToSpeech.getSupportedVoices()
      .then(({ voices }) => {
        // Native TTS voices are structurally close to SpeechSynthesisVoice
        voicesCache = voices as unknown as SpeechSynthesisVoice[];
        return voicesCache;
      })
      .catch((error) => {
        console.error('[ttsService] Failed to load native voices:', error);
        return [];
      });
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const syncRead = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) voicesCache = voices;
      return voices;
    };

    const voices = syncRead();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Chrome/Android populate voices asynchronously; listen until they appear
    window.speechSynthesis.onvoiceschanged = () => {
      const updated = window.speechSynthesis.getVoices();
      if (updated.length > 0) {
        voicesCache = updated;
        resolve(updated);
      }
    };
  });
};

export const getStoredVoiceName = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PREFERRED_VOICE_KEY);
};

export const setStoredVoiceName = (name: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_VOICE_KEY, name);
};

export const getStoredRate = (): number => {
  if (typeof window === 'undefined') return 1;
  const rate = localStorage.getItem(PREFERRED_RATE_KEY);
  return rate ? parseFloat(rate) : 1;
};

export const setStoredRate = (rate: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_RATE_KEY, rate.toString());
};

export const getStoredPitch = (): number => {
  if (typeof window === 'undefined') return 1;
  const pitch = localStorage.getItem(PREFERRED_PITCH_KEY);
  return pitch ? parseFloat(pitch) : 1;
};

export const setStoredPitch = (pitch: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_PITCH_KEY, pitch.toString());
};

const isOnline = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
};

const ttsCacheKey = (text: string, lang: string) => `tts:${lang}:${text}`;

/** Play a Blob URL through an <audio> element, resolving when finished/failed. */
const playBlob = (url: string): Promise<void> =>
  new Promise((resolve) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });

/**
 * Offline-friendly audio TTS.
 * 1. Replays a cached blob (works fully offline).
 * 2. If online, fetches a high-quality MP3 (Google TTS) and caches it for later.
 */
const speakViaAudio = async (text: string, lang: string): Promise<void> => {
  try {
    const key = ttsCacheKey(text.trim().toLowerCase(), lang);
    const cached = await dexieService.getTtsFromCache(key);

    if (cached) {
      const url = URL.createObjectURL(new Blob([cached.blob], { type: cached.contentType }));
      try {
        await playBlob(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      return;
    }

    if (!isOnline()) {
      console.warn('[ttsService] Offline and no cached audio for this text');
      return;
    }

    const tl = lang === 'ar' ? 'ar-SA' : lang === 'bn' ? 'bn-BD' : 'en-US';
    const q = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${q}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`TTS fetch failed: ${response.status}`);
    const blob = await response.blob();

    await dexieService.saveTtsToCache(key, blob, response.headers.get('content-type') || 'audio/mpeg');

    const objectUrl = URL.createObjectURL(new Blob([blob], { type: blob.type }));
    try {
      await playBlob(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    console.error('[ttsService] Audio TTS fallback failed:', error);
  }
};

const hasWebSpeech = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export const speakText = async (text: string) => {
  if (typeof window === 'undefined') return;

  const lang = detectLang(text);

  if (isNativePlatform) {
    try {
      // Flush any ongoing utterance so rapid taps replay cleanly
      await TextToSpeech.stop();

      await TextToSpeech.speak({
        text,
        lang: langToTag(lang),
        rate: getStoredRate(),
        pitch: getStoredPitch(),
        volume: 1.0,
        category: 'ambient',
        queueStrategy: 0, // 0 = Flush current utterance
      });
    } catch (error) {
      console.error('[ttsService] Native TTS Error:', error);
      // Fall back to the cache/audio path if the native engine fails
      await speakViaAudio(text, lang);
    }
    return;
  }

  // Cancel any ongoing speech
  if (hasWebSpeech()) window.speechSynthesis.cancel();

  // Harden: ensure voices are loaded (with a short grace period)
  if (voicesCache.length === 0 && hasWebSpeech()) {
    try {
      await Promise.race([
        loadVoices(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Voice load timeout')), 2500)),
      ]);
    } catch {
      // Timeout / unsupported — voicesCache may remain empty
    }
  }

  const preferredName = getStoredVoiceName();
  const selectedVoice = findVoice(lang, preferredName);

  // Arabic/Bengali (and English) need a matching voice to be useful.
  const voiceReady = voicesCache.length > 0;

  if (voiceReady) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = getStoredRate();
    utterance.pitch = getStoredPitch();

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      const langTag = lang === 'ar' ? 'ar-SA' : lang === 'bn' ? 'bn-BD' : 'en-US';
      utterance.lang = langTag;
    }

    // Chrome/Edge bug: cancel() can leave synthesis paused; resume re-kicks it.
    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      // If the Web Speech engine fails for Arabic/bangla (e.g. missing engine),
      // fall back to the offline-capable audio path.
      if (lang !== 'en' && (e.error === 'error' || e.error === 'not-allowed' || e.error === 'synthesis-failed')) {
        speakViaAudio(text, lang);
      }
    };

    window.speechSynthesis.speak(utterance);
    try {
      window.speechSynthesis.resume();
    } catch {
      // resume may throw in some engines; ignore
    }
    return;
  }

  // No matching voice (or Web Speech unsupported) → use the offline-capable audio fallback.
  await speakViaAudio(text, lang);
};

export const stopSpeaking = () => {
  if (isNativePlatform) {
    TextToSpeech.stop().catch((error) => console.error('[ttsService] Error stopping native TTS:', error));
    return;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
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

const findVoice = (lang: string, preferredName: string | null): SpeechSynthesisVoice | null => {
  // 1. Explicit user preference
  if (preferredName) {
    const preferred = voicesCache.find(v => v.name === preferredName);
    if (preferred) return preferred;
  }

  const prefix = lang.split('-')[0];

  // 2. Local voice matching the target language
  const local = voicesCache.find(v => v.lang.toLowerCase().startsWith(prefix) && v.localService);
  if (local) return local;

  // 3. Any voice matching the target language
  const any = voicesCache.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (any) return any;

  return null;
};

export const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesCache = voices;
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        voicesCache = updatedVoices;
        resolve(updatedVoices);
      };
    }
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

export const speakText = async (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error('Text-to-speech not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Ensure voices are loaded
  if (voicesCache.length === 0) {
    await loadVoices();
  }

  const lang = detectLang(text);
  const utterance = new SpeechSynthesisUtterance(text);

  // Pick a voice matching the detected language
  const preferredName = getStoredVoiceName();
  const selectedVoice = findVoice(lang, preferredName);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  } else {
    // Fallback: at least set the correct language (browser default voice)
    const langTag = lang === 'ar' ? 'ar-SA' : lang === 'bn' ? 'bn-BD' : 'en-US';
    utterance.lang = langTag;
  }

  utterance.rate = getStoredRate();
  utterance.pitch = getStoredPitch();

  // Error handling for playback
  utterance.onerror = (e) => {
    console.error('TTS Error:', e);
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

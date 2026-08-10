import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capgo/capacitor-speech-recognition';
import { useNative } from './useNative';

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    length: number;
}

interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
    length: number;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

interface SpeechRecognitionErrorEvent {
    error?: string;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

type SupportedLanguage = 'en-US' | 'bn-BD';

const isNative = Capacitor.isNativePlatform();

export function useVoiceSearch(onResult: (transcript: string) => void) {
    const [isListening, setIsListening] = useState(false);
    const [language, setLanguage] = useState<SupportedLanguage>('en-US');
    const [interimTranscript, setInterimTranscript] = useState<string>('');
    const { haptic } = useNative();

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const toastIdRef = useRef<string | number | null>(null);
    const hasFinalRef = useRef(false);
    const latestTranscriptRef = useRef('');
    const finalizingRef = useRef(false);

    // Track whether we already delivered a final result for the current session
    const deliveredRef = useRef(false);

    const deliverResult = useCallback((text: string) => {
        const trimmed = (text || '').trim();
        if (!trimmed || deliveredRef.current) return;
        deliveredRef.current = true;
        console.log(`✅ Recognized (${language}): "${trimmed}"`);
        onResult(trimmed);
    }, [onResult, language]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isNative) {
                NativeSpeechRecognition.removeAllListeners().catch(() => { });
            }
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    console.error("[useVoiceSearch] Cleanup error:", e);
                }
            }
        };
    }, []);

    const toggleLanguage = useCallback(() => {
        haptic('light');
        setLanguage(prev => prev === 'en-US' ? 'bn-BD' : 'en-US');
    }, [haptic]);

    const stopNative = useCallback(async () => {
        finalizingRef.current = true;
        try {
            await NativeSpeechRecognition.stop();
        } catch (e) {
            console.error("[useVoiceSearch] stop error:", e);
        }
        const last = await NativeSpeechRecognition.getLastPartialResult().catch(() => ({ text: '' }));
        deliverResult(last.text || latestTranscriptRef.current);
        setIsListening(false);
        setInterimTranscript('');
        haptic('success');
    }, [deliverResult, haptic]);

    const startNative = useCallback(async (lang: SupportedLanguage) => {
        if (!navigator.onLine) {
            toast.error("You are offline", {
                description: "Voice search requires an internet connection."
            });
            haptic('error');
            return;
        }

        // Request microphone permission first
        const permission = await NativeSpeechRecognition.requestPermissions().catch((e) => {
            console.error("[useVoiceSearch] Permission error:", e);
            return null;
        });

        if (!permission) {
            setIsListening(false);
            haptic('error');
            toast.error("Microphone denied", { description: "Please allow access" });
            return;
        }

        if (permission.speechRecognition === 'denied') {
            setIsListening(false);
            haptic('error');
            toast.error("Microphone denied", { description: "Please allow access in settings" });
            return;
        }

        haptic('success');

        deliveredRef.current = false;
        finalizingRef.current = false;
        latestTranscriptRef.current = '';
        setInterimTranscript('');
        setIsListening(true);

        try {
            // Listen for partial (live) transcripts
            await NativeSpeechRecognition.addListener('partialResults', (event) => {
                const text = event.accumulatedText || event.accumulated || event.matches?.[0] || '';
                if (text) {
                    latestTranscriptRef.current = text;
                    setInterimTranscript(text);
                }
            });

            // When the session ends, finalize with whatever we have
            await NativeSpeechRecognition.addListener('listeningState', (event) => {
                const stopped = event.state === 'stopped' || event.status === 'stopped';
                if (stopped && !finalizingRef.current) {
                    finalizingRef.current = true;
                    NativeSpeechRecognition.getLastPartialResult().then((last) => {
                        deliverResult(last.text || latestTranscriptRef.current);
                        setIsListening(false);
                        setInterimTranscript('');
                    }).catch(() => {
                        setIsListening(false);
                        setInterimTranscript('');
                    });
                }
            });

            await NativeSpeechRecognition.addListener('error', (event) => {
                if (event.code === 'aborted') return;
                console.error("[useVoiceSearch] Native recognition error:", event);
                setIsListening(false);
                setInterimTranscript('');
                if (event.code === 'not-allowed') {
                    haptic('error');
                    toast.error("Microphone denied", { description: "Please allow access" });
                } else if (event.code !== 'network') {
                    haptic('error');
                    toast.error("Recognition failed");
                }
            });

            await NativeSpeechRecognition.start({
                language: lang,
                maxResults: 5,
                partialResults: true,
                popup: false,
            });
        } catch (e) {
            console.error("[useVoiceSearch] Failed to start native recognition:", e);
            setIsListening(false);
            setInterimTranscript('');
            haptic('error');
            toast.error("Voice search failed to start");
        }
    }, [deliverResult, haptic]);

    const startWeb = useCallback((lang: SupportedLanguage) => {
        if (!navigator.onLine) {
            toast.error("You are offline", {
                description: "Voice search requires an internet connection."
            });
            haptic('error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("🎤 Voice search not supported", {
                description: "Please use Chrome, Edge, or Brave browser"
            });
            return;
        }

        haptic('success');

        // Reset state
        hasFinalRef.current = false;
        deliveredRef.current = false;
        setInterimTranscript('');
        setIsListening(true);

        const langLabel = lang === 'en-US' ? 'English' : 'Bangla';

        // Create recognizer for selected language ONLY
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = false; // Stop after first result

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[0];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            if (!isFinal) {
                setInterimTranscript(transcript);
            } else {
                hasFinalRef.current = true;
                setInterimTranscript('');
                setIsListening(false);
                haptic('success');

                deliverResult(transcript);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error === 'aborted') return;

            // Ignore no-speech error if we already have a final result
            if (event.error === 'no-speech' && hasFinalRef.current) return;

            console.error("Speech recognition error", event.error);
            setIsListening(false);
            setInterimTranscript('');

            if (event.error === 'no-speech') {
                haptic('warning');
            } else if (event.error === 'not-allowed') {
                haptic('error');
                toast.error("Microphone denied", {
                    description: "Please allow access"
                });
            } else if (event.error !== 'network') {
                haptic('error');
                // Ignore network errors which can happen frequently on mobile
                toast.error("Recognition failed");
            }
        };

        recognition.onend = () => {
            if (!hasFinalRef.current) {
                setIsListening(false);
                setInterimTranscript('');
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start", e);
            setIsListening(false);
        }
    }, [deliverResult, haptic]);

    const startListening = useCallback(() => {
        if (isListening) {
            if (isNative) {
                void stopNative();
            } else if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.error("[useVoiceSearch] stop error:", e);
                }
                setIsListening(false);
                setInterimTranscript('');
            }
            return;
        }

        if (isNative) {
            void startNative(language);
        } else {
            startWeb(language);
        }
    }, [isListening, language, startNative, startWeb, stopNative]);

    const stopListening = useCallback(() => {
        haptic('light');
        if (isNative) {
            void stopNative();
            return;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("[useVoiceSearch] stop error:", e);
            }
        }
        setIsListening(false);
        setInterimTranscript('');
    }, [haptic, stopNative]);

    return {
        isListening,
        startListening,
        stopListening,
        detectedLanguage: language === 'en-US' ? 'English' : 'Bangla', // backwards compatibility
        interimTranscript,
        language,
        toggleLanguage
    };
}

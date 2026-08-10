# Capacitor TTS (Audio) & Image-Share Integration Guide

> **Purpose:** Reference implementation extracted from the "Ai Vocab" app
> (React 18 + Vite + shadcn/ui + Tailwind + React Router + Capacitor 8).
> An AI agent can follow this document to reproduce **Text-to-Speech (audio)**
> and **image-generation-and-share** features in a **new** Capacitor app.

---

## 1. Architecture Overview

Both features use the same 3-layer pattern:

- **Service layer** (`src/services/*`) — abstracts native + web differences
  behind one plain-JS API. Safe to import anywhere (hooks, components).
- **Hook / context layer** — adds React state, settings persistence, lifecycle.
- **UI wiring** — buttons/components call the hook/service methods.

Both features detect platform at runtime with `Capacitor.isNativePlatform()`
and branch into two code paths:

| Platform | Detection | TTS path | Image Share path |
|---|---|---|---|
| **Native (Android/iOS WebView)** | `Capacitor.isNativePlatform() === true` | `@capacitor-community/text-to-speech` | `@capacitor/filesystem` (write temp PNG) → `@capacitor/share` |
| **Web / PWA** (dev + build) | `Capacitor.isNativePlatform() === false` | Browser `window.speechSynthesis` (`SpeechSynthesisUtterance`) | Web Share API `navigator.share({ files })` → fallback `<a download>` |

Rule: code must run in both environments; never assume native is available.

---

## 2. Required Dependencies (package.json)

Add to `dependencies` (Capacitor 8 era):

```json
"@capacitor-community/text-to-speech": "^8.0.0",
"@capacitor/filesystem": "^8.1.0",
"@capacitor/share": "^8.0.0",
"@capacitor/core": "^8.0.2",
"html-to-image": "^1.11.13"
```

Optional but used in the reference app:

- `@capacitor/haptics` — small haptic feedback on taps (`haptic('light' | 'success' | 'error')`).
- `@capacitor/speech-recognition` — **speech-to-text (microphone, INPUT)**.
  This is separate from TTS (audio OUTPUT). Skip unless voice-search is needed.

Install and sync the native project:

```bash
npm install
npx cap sync
```

After syncing, verify `android/app/src/main/assets/capacitor.plugins.json`
contains these mappings:

- `@capacitor-community/text-to-speech` → `com.getcapacitor.community.tts.TextToSpeechPlugin`
- `@capacitor/filesystem` → `com.capacitorjs.plugins.filesystem.FilesystemPlugin`
- `@capacitor/share` → `com.capacitorjs.plugins.share.SharePlugin`

---

## 3. Android Native Setup

### 3.1 `android/app/src/main/AndroidManifest.xml`

`cap sync` auto-injects plugin permissions. At minimum these must exist
(INTERNET + NETWORK_STATE are for share/upload; RECORD_AUDIO is only needed if
speech-recognition is used):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />   <!-- speech-recognition only -->
<uses-permission android:name="android.permission.VIBRATE" />        <!-- haptics only -->
```

No extra FileProvider config is required — the `@capacitor/share` plugin
runs its own share. (The reference app already ships a FileProvider block;
that ships with a standard Capacitor Android project, keep it.)

### 3.2 `capacitor.config.ts`

No plugin-specific keys are required for TTS or share. If you use
`@capacitor/speech-recognition`, no config key is required either.

---

## 4. FEATURE A — Text-to-Speech (Audio)

### 4.1 File `src/services/ttsService.ts`

Single service; every exported function branches native vs web.

```ts
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

const PREFERRED_VOICE_KEY = 'tts_voice_preference';
const PREFERRED_RATE_KEY = 'tts_rate_preference';
const PREFERRED_PITCH_KEY = 'tts_pitch_preference';
const PREFERRED_LANG_KEY = 'tts_lang_preference';

let voicesCache: any[] = [];
const isNativePlatform = Capacitor.isNativePlatform();

export const loadVoices = async (): Promise<any[]> => {
  if (isNativePlatform) {
    try {
      const { voices } = await TextToSpeech.getSupportedVoices();
      voicesCache = voices;
      return voices;
    } catch (error) {
      console.error('Failed to load native voices:', error);
      return [];
    }
  } else {
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
  }
};
```

**Settings persistence** uses `localStorage` with the same keys on both
platforms (native plugin has no per-app settings store for TTS):

```ts
export const getStoredVoiceName = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PREFERRED_VOICE_KEY);
};
export const setStoredVoiceName = (name: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_VOICE_KEY, name);
};
export const getStoredLang = (): string => {
  if (typeof window === 'undefined') return 'en-US';
  const lang = localStorage.getItem(PREFERRED_LANG_KEY);
  return lang || 'en-US';
};
export const setStoredLang = (lang: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERRED_LANG_KEY, lang);
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
```

The main speak call. **Native**: `TextToSpeech.stop()` first (flush queue),
then speaks with the stored language / rate / pitch, volume 1.0,
`category: 'ambient'`, `queueStrategy: 0` (Flush). **Web**: cancels current
speech, picks a voice (preferred-by-name → first English localService voice →
any English voice), then speaks.

```ts
export const speakText = async (text: string) => {
  if (isNativePlatform) {
    try {
      await TextToSpeech.stop();

      const preferredLang = getStoredLang();

      await TextToSpeech.speak({
        text,
        lang: preferredLang,
        rate: getStoredRate(),
        pitch: getStoredPitch(),
        volume: 1.0,
        category: 'ambient',
        queueStrategy: 0, // 0 = Flush current utterance
      });
    } catch (error) {
      console.error('Native TTS Error:', error);
    }
  } else {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error('Text-to-speech not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();

    if (voicesCache.length === 0) await loadVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    const preferredName = getStoredVoiceName();
    let selectedVoice = voicesCache.find((v) => v.name === preferredName);

    if (!selectedVoice) {
      selectedVoice =
        voicesCache.find((v) => v.lang.startsWith('en') && v.localService) ||
        voicesCache.find((v) => v.lang.startsWith('en'));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = getStoredRate();
    utterance.pitch = getStoredPitch();

    utterance.onerror = (e) => console.error('TTS Error:', e);

    window.speechSynthesis.speak(utterance);
  }
};

export const stopSpeaking = async () => {
  if (isNativePlatform) {
    try {
      await TextToSpeech.stop();
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
  } else {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};
```

### 4.2 File `src/hooks/useTTS.ts` (optional — settings UI)

Loads voices + stored settings on mount; exposes setters that write through to
the service and refresh state; adds `testVoice()` for preview.

```ts
import { useState, useEffect } from 'react';
import {
  loadVoices,
  getStoredVoiceName,
  setStoredVoiceName as setServiceVoice,
  getStoredRate,
  setStoredRate as setServiceRate,
  getStoredPitch,
  setStoredPitch as setServicePitch,
  speakText,
} from '../services/ttsService';

export const useTTS = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [rate, setRateState] = useState(1);
  const [pitch, setPitchState] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const initVoices = async () => {
      try {
        const loadedVoices = await loadVoices();
        if (mounted) {
          setVoices(loadedVoices);
          const storedVoice = getStoredVoiceName();
          if (storedVoice && loadedVoices.some((v) => v.name === storedVoice)) {
            setSelectedVoiceName(storedVoice);
          }
          setRateState(getStoredRate());
          setPitchState(getStoredPitch());
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load voices', e);
        if (mounted) setLoading(false);
      }
    };
    initVoices();
    return () => { mounted = false; };
  }, []);

  const setVoice = (name: string) => { setServiceVoice(name); setSelectedVoiceName(name); };
  const setRate = (value: number) => { setServiceRate(value); setRateState(value); };
  const setPitch = (value: number) => { setServicePitch(value); setPitchState(value); };
  const testVoice = (text = 'Hello, this is a test.') => speakText(text);

  return { voices, selectedVoiceName, setVoice, rate, setRate, pitch, setPitch, testVoice, loading };
};
```

### 4.3 UI wiring (how it is used)

Any button that should speak calls `speakText(text)` directly (no permission
needed on either platform):

```tsx
import { speakText } from "@/services/ttsService";

const handleSpeak = async (e: React.MouseEvent) => {
  e.stopPropagation();
  haptic('light');
  try {
    await speakText(vocab.english);   // or any text you want spoken
  } catch (error) {
    toast.error("Text-to-speech failed");
  }
};
```

The reference app wires it in: `VocabCard.tsx` (word card Audio button),
`VocabularyDetail.tsx` (word, forms, examples, synonyms, antonyms),
`Flashcards.tsx` (flashcard speak button), `ComparisonModal.tsx`.

**TTS implementation notes / gotchas:**

- Always `stop()` before `speak()` — this acts as a "flush" so rapid taps replay cleanly.
- On native, pass a `lang`; Omni example uses `'en-US'` while Bangla voice is via native TTS engines.
- Web voices can load asynchronously — listen to `voiceschanged` if `getVoices()` is empty.
- `SpeechSynthesisUtterance` requires both `utterance.rate` and `utterance.pitch`.
- Guard every browser API with `typeof window === 'undefined'` for SSR safety.

---

## 5. FEATURE B — Image Generation + Share

Goal: render a static, branded "card" image of an item, export it to PNG at
2x pixel ratio, and hand it to the native/Web share sheet.

**Files involved:**

| File | Role |
|---|---|
| `src/components/ShareableVocabularyCard.tsx` | The pixel template to capture (forwardRef + fixed width). |
| `src/components/GlobalShareProxy.tsx` | Hidden off-screen host for the template while capturing. |
| `src/contexts/ShareContext.tsx` | React context: `shareAsImage()`, `shareRef`, `sharingId`, `itemToShare`. |
| `src/hooks/useVocabularyShare.ts` | Thin hook over the context for consumers. |
| `src/services/nativeShareService.ts` | Optional: plain-text share + stand-alone image share. |

### 5.1 `src/components/ShareableVocabularyCard.tsx` (the capture template)

Rules that make the capture reliable:
- Root element is a `forwardRef` `div` — the ref is what gets captured.
- **Fixed width `450px`** so the PNG has a stable layout.
- Mostly **inline styles** (background, width, padding, borderRadius, fontFamily,
  color) + a handful of Tailwind utility classes that resolve to real CSS
  (avoid anything dependent on dynamic layout/absolute positioning).
- Always set an explicit `backgroundColor` (used in capture + PNG).

```tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Download, Heart } from 'lucide-react';

interface ShareableProps {
  item: { bangla: string; english: string; partOfSpeech: string; pronunciation?: string; examples?: { en: string; bn: string }[]; synonyms?: string[]; antonyms?: string[] };
  colors?: { background?: string; text?: string; primary?: string };
}

export const ShareableCard = React.forwardRef<HTMLDivElement, ShareableProps>(
  ({ item, colors = {} }, ref) => {
    const bgColor = colors.background || 'white';
    const primaryColor = colors.primary || '#3b82f6';

    return (
      <div
        ref={ref}
        style={{
          backgroundColor: bgColor,
          width: '450px',
          padding: '24px',
          borderRadius: '24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          color: colors.text || '#1f2937',
        }}
        className="shadow-2xl border border-blue-100 bg-white"
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500 p-2 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-blue-500 tracking-tight">Your App Name</span>
        </div>

        {/* Main content: partOfSpeech badge, big bangla word, english + pronunciation */}
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
          <Badge variant="secondary" className="px-4 py-1 text-sm ...">{item.partOfSpeech}</Badge>
          <h1 className="text-4xl font-black text-gray-900 leading-tight">{item.bangla}</h1>
          <h2 className="text-2xl font-semibold text-blue-600">{item.english}</h2>
          {item.pronunciation && <p className="text-sm text-gray-400 font-mono">/{item.pronunciation}/</p>}
        </div>

        {/* Optional: first example, synonyms, antonyms sections */}

        {/* Footer: app download hint + credit line */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/50 rounded-full">
            <Download className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-gray-400">Download Your App from Play Store</span>
          </div>
        </div>
      </div>
    );
  }
);
ShareableCard.displayName = 'ShareableCard';
```

> Design tip from the reference: use `slice(0,1)` for the example, chop
> antonyms at `slice(0,5)`, and include auto-sizing text classes so long
> words don't overflow the 450px canvas.

### 5.2 `src/components/GlobalShareProxy.tsx` (hidden host)

Renders the capture template **only while an item is selected**, fixed at
`top/left 0`, `opacity: 0`, `pointerEvents: none`, **explicit width 450px**,
`overflow: hidden`, `backgroundColor: white`, `zIndex: -1`, `visibility: visible`.

The `opacity: 0` + `visibility: visible` combo lets `html-to-image` render it
(fully `display:none` or `visibility:hidden` elements sometimes render blank),
while keeping it invisible to users.

```tsx
import React from 'react';
import { useShare } from '@/contexts/ShareContext';
import { ShareableCard } from './ShareableCard';

export const GlobalShareProxy: React.FC = () => {
  const { itemToShare, shareRef } = useShare();
  if (!itemToShare) return null;

  return (
    <div
      style={{
        position: 'fixed', top: '0', left: '0',
        opacity: 0, pointerEvents: 'none',
        width: '450px', zIndex: -1, overflow: 'hidden',
        backgroundColor: 'white', visibility: 'visible',
      }}
    >
      <ShareableCard ref={shareRef} item={itemToShare} />
    </div>
  );
};
```

### 5.3 `src/contexts/ShareContext.tsx` (the orchestrator)

Key mechanics of `shareAsImage(item)`:

1. Guard: ignore if a share is already in progress (`if (sharingId) return`).
2. Set `itemToShare` + `sharingId`, then **`setTimeout(…, 150)`** so React
   commits the hidden card into the DOM before capture.
3. Wait an extra **~500ms** inside the timeout so fonts/images settle.
4. Capture with `html-to-image`'s `toPng(shareRef.current, options)`.
5. Branch native vs web to hand the PNG to the OS share sheet.

Capture options that matter (from the reference):

```ts
const dataUrl = await toPng(shareRef.current, {
  cacheBust: true,
  pixelRatio: 2,          // crisp 900x... output
  skipAutoScale: true,
  fontEmbedCSS: '',       // avoid stylesheet fetch issues
  backgroundColor: 'white',
  style: { opacity: '1', transform: 'none', left: '0', top: '0', pointerEvents: 'auto' },
  filter: (node) => node.tagName !== 'LINK',  // drop stylesheet <link> nodes that can block rendering
});
```

Handle a suspiciously small PNG:

```ts
if (dataUrl.length < 1000) console.warn('Generated image seems empty');
```

Full provider (adapted):

```tsx
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const ShareContext = createContext(undefined);

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shareRef = useRef<HTMLDivElement>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [itemToShare, setItemToShare] = useState<any>(null);

  const shareAsImage = useCallback(async (item: any) => {
    if (sharingId) return;
    setItemToShare(item);
    setSharingId(item.id);

    setTimeout(async () => {
      try {
        if (!shareRef.current) throw new Error('Capture element not found');
        await new Promise((resolve) => setTimeout(resolve, 500));

        const dataUrl = await toPng(shareRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          skipAutoScale: true,
          fontEmbedCSS: '',
          backgroundColor: 'white',
          style: { opacity: '1', transform: 'none', left: '0', top: '0', pointerEvents: 'auto' },
          filter: (node) => node.tagName !== 'LINK',
        });
        if (dataUrl.length < 1000) console.warn('Generated image seems too small/empty');

        if (Capacitor.isNativePlatform()) {
          // NATIVE: write PNG to Cache dir, then share the file URI
          const fileName = `share-${Date.now()}.png`;
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: dataUrl,
            directory: Directory.Cache,
          });
          await Share.share({
            title: item.english,
            text: `Check this out: ${item.english}`,
            url: savedFile.uri,           // on native, URI shares the image file
            dialogTitle: 'Share Card',
          });
        } else {
          // WEB: Web Share API with File, else download fallback
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `card-${item.english.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: item.english, text: 'Check this out' });
          } else {
            const link = document.createElement('a');
            link.download = `card-${item.english.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Sharing not supported. Image downloaded instead.');
          }
        }
      } catch (error) {
        console.error('Error sharing image:', error);
        toast.error('Failed to generate sharing image. Please try again.');
      } finally {
        setSharingId(null);
        setItemToShare(null);
      }
    }, 150);
  }, [sharingId]);

  return (
    <ShareContext.Provider value={{ shareAsImage, sharingId, itemToShare, shareRef }}>
      {children}
    </ShareContext.Provider>
  );
};

export const useShare = () => {
  const ctx = useContext(ShareContext);
  if (ctx === undefined) throw new Error('useShare must be used within a ShareProvider');
  return ctx;
};
```

### 5.4 `src/hooks/useVocabularyShare.ts` (consumer hook)

```ts
import { useShare } from '@/contexts/ShareContext';

export const useVocabularyShare = () => {
  const { shareAsImage, sharingId, itemToShare, shareRef } = useShare();
  return {
    shareAsImage,
    isItemSharing: (id: string) => sharingId === id,
    itemToShare,
    shareRef,
    isSharingGlobal: !!sharingId,
  };
};
```

### 5.5 `src/services/nativeShareService.ts` (optional plain-text / image share)

A simpler alternative that shares **text only** (no PNG), plus a reusable
image-share helper. Keep it if you want share buttons without the card capture.

```ts
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export const shareText = async (title: string, text: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, dialogTitle: 'Share' });
    } else if (navigator.share) {
      await navigator.share({ title, text });
    } else {
      await navigator.clipboard.writeText(text);
      return { copied: true };
    }
    return { success: true };
  } catch (error) {
    console.error('Share failed:', error);
    return { error };
  }
};

export const sharePng = async (dataUrl: string, fileName: string, title: string, message: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const base64Data = dataUrl.split(',')[1];  // strip the data:image/png;base64, prefix
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({ title, text: message, url: result.uri, dialogTitle: 'Share Card' });
    } else {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: message });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { downloaded: true };
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Image share failed:', error);
    return { error };
  }
};
```

> Note: when writing raw base64, `Filesystem.writeFile` accepts base64 **without**
> the `data:image/png;base64,` header. When `toPng` returns a full data URL natively,
> pass it **with** the header. Both variants exist in the reference — match the code carefully.

### 5.6 Wiring — provider + proxy in the app tree

In `App.tsx` (or your root layout), wrap everything with `ShareProvider` and
mount the proxy **inside the router** so hooks work:

```tsx
import { ShareProvider } from "@/contexts/ShareContext";
import { GlobalShareProxy } from "@/components/GlobalShareProxy";

<FavoritesProvider>
  <ShareProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <GlobalShareProxy />
      <AppRoutes />
    </BrowserRouter>
  </ShareProvider>
</FavoritesProvider>
```

### 5.7 Page-level usage

```tsx
import { useVocabularyShare } from "@/hooks/useVocabularyShare";

const { shareAsImage } = useVocabularyShare();

const handleShareImage = useCallback(async (vocab: any) => {
  haptic('light');
  shareAsImage(vocab);
}, [shareAsImage, haptic]);

// In VocabCard: <Button onClick={(e) => handleShare(vocab)} ...>
```

The card component receives `onShare` and either calls it (custom image share)
or falls back to `shareText(...)`:

```tsx
const handleShare = async (e: React.MouseEvent) => {
  e.stopPropagation();
  haptic('light');
  if (onShare) { onShare(vocab); return; }
  const result = await shareText(vocab.english, shareTextBody);
  if (result.copied) toast.success("Copied to clipboard!");
  else if (result.success) haptic('success');
};
```

---

## 6. Full Integration Checklist for the AI Agent

1. **Dependencies** — add the 5 packages, `npm install`, `npx cap sync`.
2. **Android** — verify `AndroidManifest.xml` permissions (INTERNET,
   ACCESS_NETWORK_STATE; RECORD_AUDIO only if speech-in used).
3. **TTS** — create `services/ttsService.ts` (loadVoices / speakText /
   stopSpeaking + localStorage helpers). Import & call `speakText(text)` from
   the Audio buttons. Optionally create `hooks/useTTS.ts` for a settings panel.
4. **Share template** — create `components/ShareableCard.tsx` (forwardRef,
   fixed 450px width, inline styles, white background).
5. **Hidden proxy** — create `components/GlobalShareProxy.tsx` (fixed,
   opacity 0, pointerEvents none, zIndex -1, visibility visible).
6. **Context** — create `contexts/ShareContext.tsx` (`ShareProvider` + `useShare`)
   implementing `shareAsImage` exactly as in §5.3 (150ms + 500ms waits,
   `toPng` options, Filesystem→Share native / Web Share→download web).
7. **Consumer hook** — create `hooks/useVocabularyShare.ts`.
8. **App root** — wrap with `ShareProvider`, mount `<GlobalShareProxy />`
   inside the router.
9. **Pages** — call `shareAsImage(item)` from share buttons.

## 7. Common Pitfalls

- **Black/blank PNG on Android** — capture element must be `visibility: visible`
  (never `display:none`) and have an explicit `backgroundColor`; use
  `backgroundColor: 'white'` in `toPng` options.
- **Missing emoji/fonts** — keep the capture element **in the live DOM** (the proxy
  pattern) so web fonts load before `toPng`.
- **Share of the PNG fails on native** — always pass `url: savedFile.uri`
  (the Cache file URI) to `Share.share`; never the data URL.
- **Image too small** — ensure `pixelRatio: 2` and the fixed 450px width; check
  `dataUrl.length < 1000` and warn.
- **Rapid double-tap** — the `if (sharingId) return` guard serializes shares.
- **Web voice not speaking** — voices load async; wait for `voiceschanged`.
- **`navigator.share` missing on desktop** — always provide the `<a download>`
  fallback so the feature degrades gracefully.
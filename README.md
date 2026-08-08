# MyVocab Hub 🎓

A sophisticated, AI-powered vocabulary learning platform designed to help Bengali speakers master English vocabulary. Built specifically for IELTS Band 7+ preparation, combining modern web technologies with advanced AI to create a personalized learning experience.

## 🚀 Key Features

### 🧠 Intelligent Learning
- **AI-Powered Content**: Automatic generation of definitions, Bengali meanings, synonyms, antonyms, and examples using GPT-4o.
- **Smart Context**: Get real-time explanations and usage examples for any word.
- **Visual Learning**: Shareable vocabulary cards with auto-generated images for social sharing.
- **Pronunciation Mastery**: Integrated Text-to-Speech (TTS) for accurate English pronunciation.

### 📚 Comprehensive Vocabulary Management
- **Offline-First Architecture**: Full functionality without internet connection, automatically syncing when relationships are restored.
- **Real-time Synchronization**: Instant updates across all devices using FireStore live listeners.
- **Smart Search**: Deep search capability finding words by English, Bangla, synonyms, or related terms.
- **PDF Generation**: Export favorite word lists to beautifully formatted PDFs for offline study.

### 🛠️ Advanced Tools
- **Flashcard System**: Interactive spaced-repetition flashcards for effective memorization.
- **Online Dictionary**: Fallback to external dictionary APIs for words not in the local database.
- **Resource Gallery**: Curated collections of grammar rules and visual cheat sheets.
- **Admin Dashboard**: Powerful tools for managing content, users, and system analytics.

### 📱 Modern User Experience
- **Progressive Web App (PWA)**: Installable on mobile and desktop with native-like performance.
- **Responsive Design**: Fluid interface that adapts perfectly to any screen size.
- **Voice Search**: Hands-free searching using voice commands.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS & Shadcn UI
- **Animations**: Framer Motion
- **State Management**: React Query & Context API

### Mobile (Android App)
- **Cross-platform wrapper**: Capacitor 8
- **Distribution**: Direct APK (not on Google Play)
- **In-app updates**: version manifest check on launch (`public/version.json`)

### Backend & Cloud
- **Database**: Google Firebase Firestore (Real-time NoSQL)
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Local Database**: IndexedDB (via Dexie.js) for offline support
- **Hosting**: Netlify 

### AI & Services
- **AI Engine**: OpenAI GPT-4o & OpenRouter
- **Text-to-Speech**: Web Speech API
- **Translation**: Google Translate Integration

## 👨‍💻 Developed By

**Jakir Hossen**
*Full Stack Developer*

---

## 📱 Android App (Capacitor)

The same codebase runs as a responsive website (Netlify) AND a native Android app via [Capacitor](https://capacitorjs.com). The app is distributed as a **direct APK** (not via Google Play).

### Prerequisites
- Node.js + npm
- Android Studio (or the Android SDK + Java 17) for the `android/` build

### Commands
| Command | What it does |
| --- | --- |
| `npm run build` | Builds the web app (unchanged, used by Netlify) |
| `npm run cap:sync` | Builds the web app + syncs web assets into `android/` |
| `npm run cap:build:android` | Sync + compile the **debug APK** (`android/app/build/outputs/apk/debug/app-debug.apk`) |
| `npm run cap:open:android` | Opens the project in Android Studio |
| `npm run cap:assets` | Regenerates app icons/splash from `resources/` |

> For a **release APK** (signed), open `android/` in Android Studio → Build → Generate Signed App Bundle / APK.

### ⚠️ Release Checklist (IMPORTANT — do EVERY time you ship a new APK)
1. **Bump the version** in ALL THREE places:
   - `src/version.ts` → `APP_VERSION` (e.g. `"1.0.1"`)
   - `android/app/build.gradle` → `versionCode` (integer, increment) + `versionName` (matches `APP_VERSION`)
2. **Build the new APK**: `npm run cap:build:android` (debug) or a signed release APK from Android Studio.
3. **Upload the APK** to your hosting so `apkDownloadUrl` resolves, e.g. put it at
   `https://myvocab-hub.netlify.app/app-latest.apk` (Netlify deploys everything in the repo's `public/`, so a committed APK there is reachable — or use Netlify's file drop).
4. **Update `public/version.json`** → set `latestVersion`, `releaseNotes`, and keep `apkDownloadUrl` current. Commit + push so Netlify redeploys the manifest.
5. Done — the app will now show "Update available" to users on next launch.

### How the in-app update works
- On launch, the native app fetches `public/version.json` from
  `https://myvocab-hub.netlify.app/version.json` and compares `latestVersion` with `APP_VERSION`.
- If a newer version exists, a bottom "Update available" banner appears with release notes and a **Download Update** button.
- Tapping it opens the APK URL in the device browser (Android requires "Install from unknown sources" — it cannot be installed silently).
- Users can dismiss the banner; it reappears on the next app launch until they update.

### Platform-aware UI
- **Web**: standard responsive layout — desktop `Sidebar` + hover states, and mobile bottom nav below `md`.
- **Android app**: always uses the bottom navigation bar, 44px+ touch targets, safe-area (notch/nav-bar) insets, native splash screen, status bar coloring, and native haptics — via `src/hooks/usePlatform.ts` + `src/hooks/useNative.ts`.

---
*Developed for College Project Presentation*

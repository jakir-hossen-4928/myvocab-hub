/**
 * Current installed version of the app.
 *
 * EVERY TIME you release a new APK you MUST:
 * 1. Bump `APP_VERSION` here (semver, e.g. "1.0.1")
 * 2. Bump versionName/versionCode in android/app/build.gradle
 * 3. Build the new APK (npm run cap:build:android)
 * 4. Upload the APK to your hosting (see public/version.json apkDownloadUrl)
 * 5. Update public/version.json { latestVersion, releaseNotes } to match
 */
export const APP_VERSION = '1.0.0';

/** Optional build number (must match android/app/build.gradle versionCode). */
export const APP_BUILD = 1;

/** Public base URL of the hosted version manifest (coupled to the website deploy). */
export const VERSION_MANIFEST_URL = 'https://myvocab-hub.netlify.app/version.json';
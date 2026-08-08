export interface AppUpdateManifest {
  latestVersion: string;
  apkDownloadUrl: string;
  releaseNotes?: string;
}

export const FETCH_TIMEOUT_MS = 8000;

/**
 * Fetches the version manifest hosted at VERSION_MANIFEST_URL (e.g. Netlify).
 * The response shape must match `public/version.json`.
 */
export const fetchVersionManifest = async (url: string): Promise<AppUpdateManifest> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Version manifest fetch failed: ${res.status}`);
        }
        const data = (await res.json()) as AppUpdateManifest;
        if (!data.latestVersion || !data.apkDownloadUrl) {
            throw new Error('Version manifest is missing required fields');
        }
        return data;
    } finally {
        clearTimeout(timer);
    }
};

/** Compare "1.0.0" style versions. Returns true when b is strictly newer than a. */
export const isVersionNewer = (current: string, latest: string): boolean => {
    const parse = (v: string) =>
        v
            .replace(/^v/i, '')
            .split('.')
            .map((n) => parseInt(n, 10) || 0);
    const a = parse(current);
    const b = parse(latest);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const an = a[i] || 0;
        const bn = b[i] || 0;
        if (an !== bn) return bn > an;
    }
    return false;
};
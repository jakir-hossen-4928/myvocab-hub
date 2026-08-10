export const SITE_URL = 'https://myvocab-hub.netlify.app';

export const getShareUrl = (pathname: string): string =>
    `${SITE_URL}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
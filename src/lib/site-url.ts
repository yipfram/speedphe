const DEFAULT_PUBLIC_URL = 'http://localhost:3000';

function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getPublicUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_URL?.trim();

  if (!configuredUrl) {
    return DEFAULT_PUBLIC_URL;
  }

  return normalizeUrl(configuredUrl);
}

export function getPublicUrlObject() {
  return new URL(getPublicUrl());
}

export function getAbsoluteUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${getPublicUrl()}${normalizedPath}`;
}

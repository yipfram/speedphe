function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getPublicUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_URL environment variable. Set it to the full public app URL.'
    );
  }

  const normalizedUrl = normalizeUrl(configuredUrl);

  try {
    return new URL(normalizedUrl).toString().replace(/\/$/, '');
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_URL environment variable: "${configuredUrl}". Expected an absolute URL.`
    );
  }
}

export function getPublicUrlObject() {
  return new URL(getPublicUrl());
}

export function getAbsoluteUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${getPublicUrl()}${normalizedPath}`;
}

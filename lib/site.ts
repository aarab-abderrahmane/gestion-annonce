const defaultUrl = 'https://gestion-annonces.example.com';

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;

  if (!raw) return defaultUrl;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/\/+$/, '');
  }

  return `https://${raw.replace(/\/+$/, '')}`;
}

export function absoluteUrl(pathname = '/') {
  return new URL(pathname, `${getSiteUrl()}/`).toString();
}

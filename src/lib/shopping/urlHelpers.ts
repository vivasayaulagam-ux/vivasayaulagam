import { normalizeSinglePath } from '../utils';

/**
 * Resolves the public base URL of the website.
 * Priority:
 * 1. process.env.APP_URL
 * 2. process.env.NEXT_PUBLIC_APP_URL
 * 3. Request host header if provided
 * 4. Default fallback: https://vivasayaulagam.com
 */
export function getBaseUrl(req?: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    if (host) {
      const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.');
      const safeProto = isLocal ? proto : 'https';
      return `${safeProto}://${host}`.replace(/\/+$/, '');
    }
  }
  return 'https://vivasayaulagam.com';
}

/**
 * Converts a product's seoSlug or _id into a full public HTTPS canonical URL.
 */
export function toAbsoluteProductUrl(seoSlug?: string, id?: string, baseUrl?: string): string {
  const base = (baseUrl || getBaseUrl()).replace(/\/+$/, '');
  const raw = (seoSlug && String(seoSlug).trim()) ? String(seoSlug).trim() : (id ? String(id) : '');
  
  // Sanitize leading slashes, domain prefixes, and '/products/' or 'products/' prefixes
  let cleanSlug = raw
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+/, '')
    .replace(/^products\//i, '')
    .replace(/^\/+/, '');

  if (!cleanSlug) cleanSlug = String(id || '');
  return `${base}/product/${encodeURIComponent(cleanSlug)}`;
}

/**
 * Converts any relative image path (e.g. /uploads/products/semiya.png) to an absolute HTTPS URL.
 */
export function toAbsoluteImageUrl(src?: string, baseUrl?: string): string {
  if (!src || typeof src !== 'string') return '';
  const normalized = normalizeSinglePath(src);
  if (!normalized) return '';

  if (normalized.startsWith('https://')) {
    return normalized;
  }
  if (normalized.startsWith('http://')) {
    // If it points to our domain with http, upgrade to https
    return normalized.replace(/^http:\/\//i, 'https://');
  }

  const base = (baseUrl || getBaseUrl()).replace(/\/+$/, '');
  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${base}${cleanPath}`;
}

/**
 * Sanitizes HTML tags, extra whitespace, and unsafe XML characters for product feeds.
 */
export function sanitizeDescription(html?: string): string {
  if (!html || typeof html !== 'string') return 'Premium organic Tamil Nadu product direct from local farms.';

  // 1. Remove HTML tags
  let plain = html.replace(/<[^>]*>/g, ' ');

  // 2. Decode common HTML entities
  plain = plain
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  // 3. Remove non-printable control characters
  plain = plain.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 4. Collapse consecutive whitespace
  plain = plain.replace(/\s+/g, ' ').trim();

  return plain || 'Premium organic Tamil Nadu product direct from local farms.';
}

/**
 * Escapes characters for XML output.
 */
export function escapeXml(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

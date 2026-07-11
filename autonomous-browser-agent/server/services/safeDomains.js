import { URL } from 'url';

export const ALLOWED_DOMAINS = [
  'example.com',
  'httpbin.org',
  'wikipedia.org',
  'wikipedia.com',
  'developer.mozilla.org',
  'localhost',
  '127.0.0.1'
];

/**
 * Validates if the given URL string is allowed by checking its hostname against the allowlist.
 * @param {string} urlStr 
 * @returns {boolean}
 */
export function isUrlAllowed(urlStr) {
  try {
    const parsedUrl = new URL(urlStr);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    // Check if hostname matches any allowed domain or is a subdomain of an allowed domain
    return ALLOWED_DOMAINS.some(allowedDomain => {
      if (hostname === allowedDomain) return true;
      if (hostname.endsWith('.' + allowedDomain)) return true;
      return false;
    });
  } catch (error) {
    return false;
  }
}

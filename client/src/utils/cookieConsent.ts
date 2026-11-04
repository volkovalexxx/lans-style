// Cookie consent: 'all' = necessary + analytics/marketing (Meta Pixel), 'necessary' = only what the site needs to work.
// The same key is read by the inline Meta Pixel snippet in index.html, so keep them in sync.
export type CookieConsent = 'all' | 'necessary';

const KEY = 'lans-cookie-consent';
const EVENT = 'lans:open-cookie-settings';

export function getCookieConsent(): CookieConsent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'all' || v === 'necessary' ? v : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(value: CookieConsent) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* storage may be blocked — banner will simply show again */
  }
  try {
    const fbq = (window as { fbq?: (...a: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      if (value === 'all') {
        // events fired while revoked are held by the pixel and sent on grant — no manual PageView here
        fbq('consent', 'grant');
      } else {
        fbq('consent', 'revoke');
      }
    }
  } catch {
    /* pixel errors must not break the app */
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenCookieSettings(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

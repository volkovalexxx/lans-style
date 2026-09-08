declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function fbqTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const fn = window.fbq;
  if (typeof fn !== 'function') return;
  try {
    if (params) fn('track', event, params);
    else fn('track', event);
  } catch {
    /* pixel errors must not break the app */
  }
}

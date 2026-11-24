import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const KEY = 'lans-scroll';

function readPositions(): Record<string, number> {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export default function ScrollToTop() {
  const { pathname, search, hash, key } = useLocation();
  const navType = useNavigationType();
  const firstRun = useRef(true);
  // The initial history entry always has key "default", so add the URL to keep entries apart.
  const entry = `${key}|${pathname}${search}`;

  // Remember where the user was on this history entry.
  useEffect(() => {
    const save = () => {
      const all = readPositions();
      all[entry] = window.scrollY;
      try { sessionStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage blocked */ }
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [entry]);

  useEffect(() => {
    // Let in-page anchor links keep their native behavior (e.g. /wholesale#request)
    if (hash) return;
    // A fresh page load also reports POP: forget any stale position saved for this entry.
    if (firstRun.current) {
      firstRun.current = false;
      const all = readPositions();
      delete all[entry];
      try { sessionStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage blocked */ }
      return;
    }
    if (navType === 'POP') {
      // Back/forward: return to the saved position once the page is tall enough (content loads async).
      const y = readPositions()[entry] ?? 0;
      let tries = 0;
      const restore = () => {
        if (document.documentElement.scrollHeight - window.innerHeight >= y || tries++ > 180) {
          window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });
        } else {
          requestAnimationFrame(restore);
        }
      };
      restore();
      return;
    }
    // Filter changes in the catalog replace the URL — don't jump to top on them.
    if (navType === 'REPLACE') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [entry, hash, navType]);

  return null;
}

import * as React from 'react';
import { getTourElement } from '../consts';

/**
 * Finds a DOM element by data-tour attribute, waits for it if not immediately available
 * (MutationObserver, 5s timeout), and tracks its bounding rect on resize/scroll.
 */
export const useTargetElement = (target: string) => {
  const [targetEl, setTargetEl] = React.useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    const el = getTourElement(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTargetEl(el);
      setTargetRect(el.getBoundingClientRect());
      return undefined;
    }

    // Watch for target appearing in DOM (dynamic/lazy content)
    const observer = new MutationObserver(() => {
      const found = getTourElement(target);
      if (found) {
        found.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTargetEl(found);
        setTargetRect(found.getBoundingClientRect());
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = setTimeout(() => observer.disconnect(), 5000);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [target]);

  // Update rect on resize/scroll
  React.useEffect(() => {
    if (!targetEl) return undefined;

    const updateRect = () => setTargetRect(targetEl.getBoundingClientRect());
    const observer = new ResizeObserver(updateRect);
    observer.observe(targetEl);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetEl]);

  return { targetEl, targetRect };
};

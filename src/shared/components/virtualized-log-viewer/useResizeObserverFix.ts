import React from 'react';

/**
 * Suppresses harmless ResizeObserver errors from @tanstack/react-virtual
 * This is a known browser limitation when virtualizer measures elements during certain operations
 * @see https://github.com/WICG/resize-observer/issues/38
 */
export function useResizeObserverFix() {
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.message?.includes('ResizeObserver loop limit exceeded')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    // Use capture phase to catch errors earlier
    window.addEventListener('error', handleError, { capture: true });
    return () => window.removeEventListener('error', handleError, { capture: true });
  }, []);
}

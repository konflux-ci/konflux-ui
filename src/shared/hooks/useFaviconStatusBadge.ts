import * as React from 'react';
import {
  applyFaviconBadge,
  readFaviconHref,
  restoreFaviconHref,
} from '~/shared/utils/favicon-badge';

/**
 * Updates the browser tab favicon with a colored status badge overlay.
 * Restores the original favicon on unmount.
 */
export const useFaviconStatusBadge = (color: string): void => {
  const baselineHrefRef = React.useRef<string>();

  React.useEffect(() => {
    baselineHrefRef.current = readFaviconHref();
    return () => {
      restoreFaviconHref(baselineHrefRef.current);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void applyFaviconBadge(color, baselineHrefRef.current, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [color]);
};

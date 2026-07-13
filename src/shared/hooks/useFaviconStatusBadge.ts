import * as React from 'react';
import {
  applyFaviconBadge,
  readFaviconHref,
  restoreFaviconHref,
} from '~/shared/utils';

/**
 * Updates the browser tab favicon with a colored status badge overlay.
 * Restores the original favicon on unmount.
 */
export const useFaviconStatusBadge = (color: string): void => {
  const baselineHrefRef = React.useRef<string | undefined>(undefined);
  if (baselineHrefRef.current === undefined) {
    baselineHrefRef.current = readFaviconHref();
  }

  React.useEffect(() => {
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

import * as React from 'react';
import { applyFaviconBadge, readFaviconHref, restoreFaviconHref } from '~/shared/utils';

/**
 * Updates the browser tab favicon with a colored status badge overlay.
 * Restores the original favicon on unmount.
 * Pass null to skip applying a badge while status is not yet known.
 */
export const useFaviconStatusBadge = (color: string | null): void => {
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
    if (color === null) {
      restoreFaviconHref(baselineHrefRef.current);
      return;
    }

    let cancelled = false;
    void applyFaviconBadge(color, baselineHrefRef.current, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [color]);
};

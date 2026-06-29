import * as React from 'react';
import {
  acquireFaviconBadge,
  applyFaviconBadge,
  releaseFaviconBadge,
} from '~/shared/utils/favicon-badge';

/**
 * Updates the browser tab favicon with a colored status badge overlay.
 * Restores the original favicon on unmount.
 */
export const useFaviconStatusBadge = (color: string): void => {
  React.useEffect(() => {
    acquireFaviconBadge();
    return () => {
      releaseFaviconBadge();
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void applyFaviconBadge(color, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [color]);
};

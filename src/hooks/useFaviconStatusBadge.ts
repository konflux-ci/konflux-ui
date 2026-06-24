import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import {
  acquireFaviconBadge,
  applyFaviconBadge,
  releaseFaviconBadge,
} from '~/shared/utils/favicon-badge';

/**
 * Updates the browser tab favicon with a colored status badge overlay.
 * Restores the original favicon on unmount or when status is cleared.
 */
export const useFaviconStatusBadge = (status: runStatus | null | undefined): void => {
  React.useEffect(() => {
    let cancelled = false;

    acquireFaviconBadge();
    void applyFaviconBadge(status, () => cancelled);

    return () => {
      cancelled = true;
      releaseFaviconBadge();
    };
  }, [status]);
};

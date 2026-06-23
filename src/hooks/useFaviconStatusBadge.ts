import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import { applyFaviconBadge, restoreFavicon } from '~/shared/utils/favicon-badge';

/**
 * Updates the browser tab favicon with a colored status badge overlay.
 * Restores the original favicon on unmount or when status is cleared.
 */
export const useFaviconStatusBadge = (status: runStatus | null | undefined): void => {
  React.useEffect(() => {
    let cancelled = false;

    void applyFaviconBadge(status, () => cancelled);

    return () => {
      cancelled = true;
      restoreFavicon();
    };
  }, [status]);
};

import * as React from 'react';
import { runStatus } from '~/consts/pipelinerun';
import {
  acquireFaviconBadge,
  applyFaviconBadge,
  releaseFaviconBadge,
} from '~/shared/utils/favicon-badge';

export type UseDocumentTitleOptions = {
  faviconStatus?: runStatus | null;
};

/**
 * Dynamically updates the page title and optionally the favicon status badge.
 * Restores the default title and favicon on unmount.
 */
export const useDocumentTitle = (title: string, options?: UseDocumentTitleOptions): void => {
  const faviconStatus = options?.faviconStatus;

  React.useEffect(() => {
    let cancelled = false;

    document.title = title;
    if (faviconStatus != null) {
      acquireFaviconBadge();
      void applyFaviconBadge(faviconStatus, () => cancelled);
    }

    return () => {
      cancelled = true;
      document.title = 'Konflux';
      if (faviconStatus != null) {
        releaseFaviconBadge();
      }
    };
  }, [title, faviconStatus]);
};

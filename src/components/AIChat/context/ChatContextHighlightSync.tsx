import * as React from 'react';
import {
  clearAllContextHighlightsInDocument,
  syncSelectedHighlights,
} from './highlight';
import { ChatContextSelection } from './types';

const MUTATION_SYNC_DELAY_MS = 50;

type ChatContextHighlightSyncProps = {
  selectedContexts: ChatContextSelection[];
};

export const ChatContextHighlightSync: React.FC<ChatContextHighlightSyncProps> = ({
  selectedContexts,
}) => {
  React.useEffect(() => {
    const selectedIds = new Set(selectedContexts.map((context) => context.id));

    const sync = () => {
      if (selectedIds.size === 0) {
        clearAllContextHighlightsInDocument();
        return;
      }
      syncSelectedHighlights(selectedIds);
    };

    sync();

    let mutationTimeoutId: ReturnType<typeof setTimeout>;
    const scheduleSync = () => {
      clearTimeout(mutationTimeoutId);
      mutationTimeoutId = setTimeout(sync, MUTATION_SYNC_DELAY_MS);
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });

    let animationFrameId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(sync);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      clearTimeout(mutationTimeoutId);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [selectedContexts]);

  return null;
};

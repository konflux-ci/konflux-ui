import React from 'react';
import type { HighlightedLineRange } from '~/shared/components/virtualized-log-viewer/useLineNumberNavigation';

interface UseAutoScrollWithResumeParams {
  allowAutoScroll?: boolean;
  /**
   * The currently targeted log line range from URL hash navigation (e.g. `{ start: 20000, end:
   * 20000 }`), or null/undefined when there's no active line target. Whenever this changes to a
   * new range (including already being set at mount), auto-scroll-to-bottom is paused so it
   * doesn't fight the scroll-to-that-line navigation while new lines keep streaming in. Explicit
   * `handleResumeClick` calls always re-enable auto-scroll regardless of this value.
   */
  activeLineTarget?: HighlightedLineRange | null;
  onScroll?: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
}

interface UseAutoScrollWithResumeReturn {
  scrollDirection: 'forward' | 'backward' | null;
  autoScroll: boolean;
  showResumeStreamButton: boolean;
  handleScroll: (props: {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }) => void;
  handleResumeClick: () => void;
}

/**
 * Hook to manage auto-scroll and resume button logic for log viewers
 *
 * Handles:
 * - Auto-scroll state management
 * - Scroll direction tracking with debouncing to prevent flickering
 * - Resume button visibility logic
 * - User vs programmatic scroll detection
 */
export const useAutoScrollWithResume = ({
  allowAutoScroll = false,
  activeLineTarget = null,
  onScroll,
}: UseAutoScrollWithResumeParams = {}): UseAutoScrollWithResumeReturn => {
  const [scrollDirection, setScrollDirection] = React.useState<'forward' | 'backward' | null>(null);
  const [autoScroll, setAutoScroll] = React.useState(allowAutoScroll && !activeLineTarget);

  // Debounce scroll direction to prevent flickering
  const scrollDirectionTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const lastScrollDirectionRef = React.useRef<'forward' | 'backward' | null>(null);

  // Sync autoScroll with allowAutoScroll prop, but skip the redundant call on mount so it
  // doesn't clobber the initial value above.
  const prevAllowAutoScrollRef = React.useRef(allowAutoScroll);
  React.useEffect(() => {
    if (prevAllowAutoScrollRef.current !== allowAutoScroll) {
      setAutoScroll(allowAutoScroll);
    }
    prevAllowAutoScrollRef.current = allowAutoScroll;
  }, [allowAutoScroll]);

  // Whenever a new line navigation target appears (including already being set at mount, via
  // the lazy initial state above), pause auto-scroll so it doesn't keep fighting the
  // scroll-to-that-line behavior as new log lines stream in. Re-targeting the same line again
  // doesn't re-trigger this, so it won't undo an explicit resume click.
  const prevActiveLineTargetRef = React.useRef(activeLineTarget);
  React.useEffect(() => {
    const prev = prevActiveLineTargetRef.current;
    const isNewTarget = activeLineTarget?.start !== prev?.start || activeLineTarget?.end !== prev?.end;
    if (activeLineTarget && isNewTarget) {
      setAutoScroll(false);
    }
    prevActiveLineTargetRef.current = activeLineTarget;
  }, [activeLineTarget]);

  // Calculate if resume button should be shown
  const showResumeStreamButton = allowAutoScroll && scrollDirection === 'backward';

  // Handle scroll events
  const handleScroll = React.useCallback(
    (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => {
      const { scrollDirection: logViewerScrollDirection, scrollUpdateWasRequested } = props;

      // Debounce backward direction to prevent flickering from scroll jitter
      if (logViewerScrollDirection === 'backward') {
        lastScrollDirectionRef.current = 'backward';
        clearTimeout(scrollDirectionTimeoutRef.current);
        scrollDirectionTimeoutRef.current = setTimeout(() => {
          // Only update if still backward after 200ms
          if (lastScrollDirectionRef.current === 'backward') {
            setScrollDirection('backward');
          }
        }, 200);
      } else {
        // Forward direction: update immediately to hide button quickly
        lastScrollDirectionRef.current = 'forward';
        clearTimeout(scrollDirectionTimeoutRef.current);
        setScrollDirection('forward');
      }
      // scrollUpdateWasRequested=true means user manually scrolled (PatternFly semantics)
      if (scrollUpdateWasRequested) {
        setAutoScroll(false);
      }

      // Call original onScroll callback
      onScroll?.(props);
    },
    [onScroll],
  );

  // Handle resume button click
  const handleResumeClick = React.useCallback(() => {
    setAutoScroll(true);
    setScrollDirection('forward');
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      clearTimeout(scrollDirectionTimeoutRef.current);
    };
  }, []);

  return {
    scrollDirection,
    autoScroll,
    showResumeStreamButton,
    handleScroll,
    handleResumeClick,
  };
};

import React from 'react';

interface UseAutoScrollWithResumeParams {
  allowAutoScroll?: boolean;
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
  onScroll,
}: UseAutoScrollWithResumeParams = {}): UseAutoScrollWithResumeReturn => {
  const [scrollDirection, setScrollDirection] = React.useState<'forward' | 'backward' | null>(null);
  const [autoScroll, setAutoScroll] = React.useState(allowAutoScroll);

  // Debounce scroll direction to prevent flickering
  const scrollDirectionTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const lastScrollDirectionRef = React.useRef<'forward' | 'backward' | null>(null);

  // Sync autoScroll with allowAutoScroll prop
  React.useEffect(() => {
    setAutoScroll(allowAutoScroll);
  }, [allowAutoScroll]);

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

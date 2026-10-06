import * as React from 'react';

const DEFAULT_INTERVAL_MS = 1000;

export const useCurrentTime = (enabled = true, intervalMs = DEFAULT_INTERVAL_MS): number => {
  const [currentTime, setCurrentTime] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    const updateCurrentTime = () => setCurrentTime(Date.now());
    updateCurrentTime();

    const handle = setInterval(updateCurrentTime, intervalMs);
    return () => clearInterval(handle);
  }, [enabled, intervalMs]);

  return currentTime;
};

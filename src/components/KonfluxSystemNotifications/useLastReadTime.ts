import { useState } from 'react';

const STORAGE_KEY = 'lastReadTime';

export const getLastReadTime = (): number => {
  const val = window.localStorage.getItem(STORAGE_KEY);
  return val ? parseInt(val, 10) : 0;
};

export const setLastReadTime = (timestamp: number): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, timestamp.toString());
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to set the LastReadTime:', err);
  }
};

export function useLastReadTime() {
  const [lastReadTimeState, setLastReadTimeState] = useState<number>(() => getLastReadTime());

  const markAllRead = () => {
    const now = Date.now();
    setLastReadTime(now);
    setLastReadTimeState(now);
  };

  return { lastReadTimeState, markAllRead };
}

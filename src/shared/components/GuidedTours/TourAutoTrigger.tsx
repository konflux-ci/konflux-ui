import * as React from 'react';
import { useTourAutoTrigger } from './hooks/useTourAutoTrigger';

/**
 * Component wrapper for useTourAutoTrigger hook.
 * Mounted at the app root inside TourProvider to auto-trigger tours
 * based on the current URL.
 */
export const TourAutoTrigger: React.FC = () => {
  useTourAutoTrigger();
  return null;
};

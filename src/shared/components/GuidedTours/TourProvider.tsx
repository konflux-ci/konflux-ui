import * as React from 'react';
import { initialTourState, tourReducer } from './tour-reducer';
import { TourContextValue } from './types';

const TourContext = React.createContext<TourContextValue | null>(null);

export const useTourContext = (): TourContextValue => {
  const ctx = React.useContext(TourContext);
  if (!ctx) {
    throw new Error('useTourContext must be used within TourProvider');
  }
  return ctx;
};

export const TourProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = React.useReducer(tourReducer, initialTourState);

  const value = React.useMemo<TourContextValue>(() => ({ state, dispatch }), [state]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

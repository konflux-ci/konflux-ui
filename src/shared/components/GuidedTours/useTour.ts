import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { useTourContext } from './TourProvider';
import { MergedStep, TourStepConfig, TourStorage } from './types';

const TOUR_STORAGE_KEY = 'konflux-tours';

export const useTour = () => {
  const { state, dispatch } = useTourContext();
  const [seen, setSeen] = useLocalStorage<TourStorage>(TOUR_STORAGE_KEY, {});

  const startTour = useCallback(
    (mergedSteps: MergedStep[], sourceIds: string[]) => {
      dispatch({ type: 'START', payload: { mergedSteps, sourceIds } });
    },
    [dispatch],
  );

  const next = useCallback(() => dispatch({ type: 'NEXT' }), [dispatch]);
  const prev = useCallback(() => dispatch({ type: 'PREV' }), [dispatch]);

  const markSeen = useCallback(
    (status: 'completed' | 'dismissed') => {
      setSeen((previousSeen) => {
        const updated = { ...(previousSeen ?? {}) };
        state.sourceIds.forEach((id) => {
          updated[id] = { status, timestamp: Date.now() };
        });
        return updated;
      });
    },
    [setSeen, state.sourceIds],
  );

  const skip = useCallback(() => {
    markSeen('dismissed');
    dispatch({ type: 'SKIP' });
  }, [dispatch, markSeen]);

  const done = useCallback(() => {
    markSeen('completed');
    dispatch({ type: 'DONE' });
  }, [dispatch, markSeen]);

  const currentStep: TourStepConfig | undefined = useMemo(
    () => state.mergedSteps[state.currentStepIndex]?.step,
    [state.mergedSteps, state.currentStepIndex],
  );

  const isLastStep = state.currentStepIndex === state.mergedSteps.length - 1;
  const isFirstStep = state.currentStepIndex === 0;

  return {
    isActive: state.isActive,
    currentStep,
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.mergedSteps.length,
    isFirstStep,
    isLastStep,
    startTour,
    next,
    prev,
    skip,
    done,
    seen: seen ?? {},
  };
};

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { TOUR_ACTIONS, TOUR_STATUS, TOUR_STORAGE_KEY } from '../consts';
import { useTourContext } from '../TourProvider';
import { MergedStep, TourStepConfig, TourStorage } from '../types';

export const useTour = () => {
  const { state, dispatch } = useTourContext();
  const [seen, setSeen] = useLocalStorage<TourStorage>(TOUR_STORAGE_KEY, {});

  const startTour = useCallback(
    (mergedSteps: MergedStep[], sourceIds: string[]) => {
      dispatch({ type: TOUR_ACTIONS.START, payload: { mergedSteps, sourceIds } });
    },
    [dispatch],
  );

  const next = useCallback(() => dispatch({ type: TOUR_ACTIONS.NEXT }), [dispatch]);
  const prev = useCallback(() => dispatch({ type: TOUR_ACTIONS.PREV }), [dispatch]);

  const markSeen = useCallback(
    (status: typeof TOUR_STATUS.COMPLETED | typeof TOUR_STATUS.DISMISSED) => {
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
    markSeen(TOUR_STATUS.DISMISSED);
    dispatch({ type: TOUR_ACTIONS.SKIP });
  }, [dispatch, markSeen]);

  const done = useCallback(() => {
    markSeen(TOUR_STATUS.COMPLETED);
    dispatch({ type: TOUR_ACTIONS.DONE });
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

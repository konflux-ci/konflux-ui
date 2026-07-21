import { TourAction, TourState } from './types';

export const initialTourState: TourState = {
  isActive: false,
  mergedSteps: [],
  currentStepIndex: 0,
  sourceIds: [],
};

export const tourReducer = (state: TourState, action: TourAction): TourState => {
  switch (action.type) {
    case 'START':
      return {
        isActive: true,
        mergedSteps: action.payload.mergedSteps,
        currentStepIndex: 0,
        sourceIds: action.payload.sourceIds,
      };
    case 'NEXT':
      return {
        ...state,
        currentStepIndex: Math.min(state.currentStepIndex + 1, state.mergedSteps.length - 1),
      };
    case 'PREV':
      return {
        ...state,
        currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
      };
    case 'SKIP':
    case 'DONE':
      return initialTourState;
    default:
      return state;
  }
};

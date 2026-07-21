import { tourReducer, initialTourState } from '../tour-reducer';
import { MergedStep, TourState } from '../types';

const makeStep = (title: string): MergedStep => ({
  step: { type: 'modal', title, content: title },
  sourceId: 'test-tour',
});

describe('tourReducer', () => {
  it('returns initial state', () => {
    expect(initialTourState).toEqual({
      isActive: false,
      mergedSteps: [],
      currentStepIndex: 0,
      sourceIds: [],
    });
  });

  it('START sets active tour state', () => {
    const steps = [makeStep('A'), makeStep('B')];
    const state = tourReducer(initialTourState, {
      type: 'START',
      payload: { mergedSteps: steps, sourceIds: ['tour-1'] },
    });
    expect(state.isActive).toBe(true);
    expect(state.mergedSteps).toBe(steps);
    expect(state.currentStepIndex).toBe(0);
    expect(state.sourceIds).toEqual(['tour-1']);
  });

  it('NEXT increments step index', () => {
    const active: TourState = {
      isActive: true,
      mergedSteps: [makeStep('A'), makeStep('B'), makeStep('C')],
      currentStepIndex: 0,
      sourceIds: ['t'],
    };
    const state = tourReducer(active, { type: 'NEXT' });
    expect(state.currentStepIndex).toBe(1);
  });

  it('NEXT does not exceed step count', () => {
    const active: TourState = {
      isActive: true,
      mergedSteps: [makeStep('A')],
      currentStepIndex: 0,
      sourceIds: ['t'],
    };
    const state = tourReducer(active, { type: 'NEXT' });
    expect(state.currentStepIndex).toBe(0);
  });

  it('PREV decrements step index', () => {
    const active: TourState = {
      isActive: true,
      mergedSteps: [makeStep('A'), makeStep('B')],
      currentStepIndex: 1,
      sourceIds: ['t'],
    };
    const state = tourReducer(active, { type: 'PREV' });
    expect(state.currentStepIndex).toBe(0);
  });

  it('PREV does not go below 0', () => {
    const active: TourState = {
      isActive: true,
      mergedSteps: [makeStep('A')],
      currentStepIndex: 0,
      sourceIds: ['t'],
    };
    const state = tourReducer(active, { type: 'PREV' });
    expect(state.currentStepIndex).toBe(0);
  });

  it('SKIP resets to initial state', () => {
    const active: TourState = {
      isActive: true,
      mergedSteps: [makeStep('A')],
      currentStepIndex: 0,
      sourceIds: ['t'],
    };
    const state = tourReducer(active, { type: 'SKIP' });
    expect(state).toEqual(initialTourState);
  });

  it('DONE resets to initial state', () => {
    const active: TourState = {
      isActive: true,
      mergedSteps: [makeStep('A')],
      currentStepIndex: 0,
      sourceIds: ['t'],
    };
    const state = tourReducer(active, { type: 'DONE' });
    expect(state).toEqual(initialTourState);
  });
});

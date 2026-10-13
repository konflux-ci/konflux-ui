import { collectAndMerge } from '../merge-utils';
import { TourConfig, TourStorage } from '../types';

const makeTour = (overrides: Partial<TourConfig> = {}): TourConfig => ({
  id: 'test-tour',
  route: 'ns/:workspaceName/applications',
  trigger: 'auto',
  priority: 0,
  steps: [{ type: 'modal', title: 'Welcome', content: 'Hello' }],
  ...overrides,
});

describe('collectAndMerge', () => {
  it('returns steps from a single tour entry', () => {
    const tour = makeTour();
    const result = collectAndMerge([tour]);

    expect(result.mergedSteps).toHaveLength(1);
    expect(result.mergedSteps[0].step.title).toBe('Welcome');
    expect(result.mergedSteps[0].sourceId).toBe('test-tour');
    expect(result.sourceIds).toEqual(['test-tour']);
  });

  it('sorts multi-step entries by priority (lower first)', () => {
    const tourA = makeTour({
      id: 'tour-a',
      priority: 10,
      steps: [
        { type: 'modal', title: 'A1', content: 'A' },
        { type: 'modal', title: 'A2', content: 'A' },
      ],
    });
    const tourB = makeTour({
      id: 'tour-b',
      priority: 0,
      steps: [
        { type: 'modal', title: 'B1', content: 'B' },
        { type: 'modal', title: 'B2', content: 'B' },
      ],
    });

    const result = collectAndMerge([tourA, tourB]);
    expect(result.mergedSteps[0].step.title).toBe('B1');
    expect(result.mergedSteps[1].step.title).toBe('B2');
    expect(result.mergedSteps[2].step.title).toBe('A1');
    expect(result.mergedSteps[3].step.title).toBe('A2');
  });

  it('inserts single-step hints before the first closing step', () => {
    const tour = makeTour({
      id: 'main-tour',
      steps: [
        { type: 'modal', title: 'Intro', content: 'Welcome' },
        { type: 'spotlight', target: 'btn', title: 'Button', content: 'Click' },
        { type: 'modal', title: 'Closing', content: 'Done', closing: true },
      ],
    });
    const hint = makeTour({
      id: 'hint-1',
      priority: 10,
      steps: [{ type: 'highlight', target: 'filter', title: 'New Filter', content: 'Try it' }],
    });

    const result = collectAndMerge([tour, hint]);
    const titles = result.mergedSteps.map((s) => s.step.title);
    expect(titles).toEqual(['Intro', 'Button', 'New Filter', 'Closing']);
  });

  it('appends hints at end when no closing step exists', () => {
    const tour = makeTour({
      id: 'main-tour',
      steps: [
        { type: 'modal', title: 'Intro', content: 'Welcome' },
        { type: 'spotlight', target: 'btn', title: 'Button', content: 'Click' },
      ],
    });
    const hint = makeTour({
      id: 'hint-1',
      steps: [{ type: 'highlight', target: 'filter', title: 'Hint', content: 'Try it' }],
    });

    const result = collectAndMerge([tour, hint]);
    const titles = result.mergedSteps.map((s) => s.step.title);
    expect(titles).toEqual(['Intro', 'Button', 'Hint']);
  });

  it('filters out seen entries when seenIds provided', () => {
    const tourA = makeTour({ id: 'seen-tour' });
    const tourB = makeTour({
      id: 'new-tour',
      steps: [{ type: 'modal', title: 'New', content: 'New' }],
    });
    const seen: TourStorage = {
      'seen-tour': { status: 'completed', timestamp: Date.now() },
    };

    const result = collectAndMerge([tourA, tourB], seen);
    expect(result.mergedSteps).toHaveLength(1);
    expect(result.sourceIds).toEqual(['new-tour']);
  });

  it('returns empty when all entries are seen', () => {
    const tour = makeTour({ id: 'seen' });
    const seen: TourStorage = {
      seen: { status: 'dismissed', timestamp: Date.now() },
    };

    const result = collectAndMerge([tour], seen);
    expect(result.mergedSteps).toHaveLength(0);
    expect(result.sourceIds).toEqual([]);
  });

  it('returns hasPrompt true when any entry has prompt: true', () => {
    const tour = makeTour({ prompt: true });
    const result = collectAndMerge([tour]);
    expect(result.hasPrompt).toBe(true);
  });

  it('returns hasPrompt false when no entry has prompt', () => {
    const tour = makeTour();
    const result = collectAndMerge([tour]);
    expect(result.hasPrompt).toBe(false);
  });

  it('returns empty for empty entries array', () => {
    const result = collectAndMerge([]);
    expect(result.mergedSteps).toHaveLength(0);
    expect(result.sourceIds).toEqual([]);
    expect(result.hasPrompt).toBe(false);
  });
});

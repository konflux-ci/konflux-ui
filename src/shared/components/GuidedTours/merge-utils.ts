import { MergedStep, TourConfig, TourStorage } from './types';

export interface MergeResult {
  mergedSteps: MergedStep[];
  sourceIds: string[];
  hasPrompt: boolean;
}

/**
 * Merges multiple tour/hint entries into a single step sequence.
 *
 * - Multi-step entries come first, sorted by priority (lower = earlier)
 * - Single-step hints insert before the first step marked closing: true
 * - If no closing step, hints append at the end
 * - Optionally filters out entries already seen (by seenIds)
 */
export const collectAndMerge = (entries: TourConfig[], seen?: TourStorage): MergeResult => {
  const filtered = seen ? entries.filter((e) => !seen[e.id]) : entries;

  if (filtered.length === 0) {
    return { mergedSteps: [], sourceIds: [], hasPrompt: false };
  }

  const sorted = [...filtered].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  const multiStep = sorted.filter((e) => e.steps.length > 1);
  const singleStep = sorted.filter((e) => e.steps.length === 1);

  // Build merged steps from multi-step entries
  const baseSteps: MergedStep[] = multiStep.flatMap((entry) =>
    entry.steps.map((step) => ({ step, sourceId: entry.id })),
  );

  // Build hint steps from single-step entries
  const hintSteps: MergedStep[] = singleStep.map((entry) => ({
    step: entry.steps[0],
    sourceId: entry.id,
  }));

  // Find first closing step index in base steps
  const closingIndex = baseSteps.findIndex((s) => s.step.closing);

  let mergedSteps: MergedStep[];
  if (hintSteps.length === 0) {
    mergedSteps = baseSteps;
  } else if (closingIndex === -1) {
    mergedSteps = [...baseSteps, ...hintSteps];
  } else {
    mergedSteps = [
      ...baseSteps.slice(0, closingIndex),
      ...hintSteps,
      ...baseSteps.slice(closingIndex),
    ];
  }

  const sourceIds = filtered.map((e) => e.id);
  const hasPrompt = filtered.some((e) => e.prompt === true);

  return { mergedSteps, sourceIds, hasPrompt };
};

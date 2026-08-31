import { SESSION_STORAGE_KEYS } from '~/consts/constants';
import { createKeyedJSONStorage } from '~/shared/utils/storage';

/**
 * Coarse classification of where a browser session arrived from.
 *
 * Three buckets are reliably detectable via `document.referrer`: `github`,
 * `gitlab`, and `other` (everything else, including an empty referrer).
 * See docs/analytics.md for details.
 */
export type ArrivalSource = 'github' | 'gitlab' | 'other';

const arrivalSourceStorage = createKeyedJSONStorage<ArrivalSource>(
  SESSION_STORAGE_KEYS.ARRIVAL_SOURCE,
  'sessionStorage',
);

const sessionStartedStorage = createKeyedJSONStorage<boolean>(
  SESSION_STORAGE_KEYS.SESSION_STARTED_FIRED,
  'sessionStorage',
);

/**
 * Classifies a `document.referrer` value into an {@link ArrivalSource}.
 * Pure function — safe to unit test without touching the DOM or storage.
 */
export function classifyReferrer(referrer: string): ArrivalSource {
  if (!referrer) {
    return 'other';
  }
  try {
    const { hostname } = new URL(referrer);
    if (hostname === 'github.com' || hostname.endsWith('.github.com')) return 'github';
    if (hostname === 'gitlab.com' || hostname.endsWith('.gitlab.com')) return 'gitlab';
    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Reads `document.referrer` once and persists the classified arrival source
 * to `sessionStorage`, guarded so a tab session only ever records its first
 * value. Must be called as early as possible during app startup — before any
 * redirect (e.g. the OAuth login flow) can run and overwrite `document.referrer`
 * on the next page load.
 */
export function captureArrivalSourceOnce(): void {
  if (arrivalSourceStorage.get() !== undefined) {
    return;
  }
  arrivalSourceStorage.set(classifyReferrer(document.referrer));
}

/**
 * Returns the arrival source persisted by {@link captureArrivalSourceOnce},
 * defaulting to `'other'` if it hasn't been captured yet or storage is
 * unavailable (e.g. Safari private mode).
 */
export function getArrivalSource(): ArrivalSource {
  return arrivalSourceStorage.get() ?? 'other';
}

/**
 * Overrides the stored arrival source with a more accurate value.
 * Used by components that can determine the source from richer context
 * (e.g. the `git-provider` label on a PipelineRun) than `document.referrer`
 * alone. Only upgrades from `'other'` — a specific source is never
 * downgraded.
 */
export function refineArrivalSource(source: ArrivalSource): void {
  if (source === 'other' || getArrivalSource() !== 'other') {
    return;
  }
  arrivalSourceStorage.set(source);
}

/**
 * Returns `true` the first time it's called in this tab session, and marks
 * the session as started so every subsequent call — from a page reload, an
 * in-app route navigation, a React effect re-run, or `StrictMode`'s dev-mode
 * double-invoke — returns `false`.
 */
export function markSessionStartedOnce(): boolean {
  if (sessionStartedStorage.get() === true) {
    return false;
  }
  sessionStartedStorage.set(true);
  return true;
}

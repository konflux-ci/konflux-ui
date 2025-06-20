import { FLAGS, FlagKey } from './flags';

type FlagState = Record<FlagKey, boolean>;
const LS_KEY = '__ff_overrides__';

/**
 * Parse URL search params to extract feature flags.
 * @param search - URL search params
 * @returns Partial<FlagState>
 */
export function parseUrlForFeatureFlags(search: string): Partial<FlagState> {
  const params = new URLSearchParams(search);
  const result: Partial<FlagState> = {};

  const bulk = params.get('ff');
  if (bulk) {
    bulk.split(',').forEach((token) => {
      result[token] = true;
    });
  }

  params.forEach((v, k) => {
    if (k.startsWith('ff_')) {
      result[k.slice(3)] = v !== 'false';
    }
  });

  return result;
}

/**
 * Parse localStorage to extract feature flags.
 * @returns Partial<FlagState>
 */
function parseStorage(): Partial<FlagState> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function compose(search: string): FlagState {
  const url = parseUrlForFeatureFlags(search);
  const ls = parseStorage();
  return Object.fromEntries(
    Object.entries(FLAGS).map(([k, meta]) => [k, url[k] ?? ls[k] ?? meta.defaultEnabled]),
  ) as FlagState;
}

/**
 * Updates the URL search params to reflect the given feature flag state.
 * @param key - The feature flag key
 * @param value - The feature flag value
 */
function updateUrlSearchParams(key: FlagKey, value: boolean) {
  const params = new URLSearchParams(location.search);

  if (value) {
    params.set(`ff_${key}`, 'true');
  } else {
    params.set(`ff_${key}`, 'false');
  }

  const bulk = params.get('ff');
  if (bulk) {
    const bulkFlags = new Set(bulk.split(','));
    if (value) {
      bulkFlags.add(key);
    } else {
      bulkFlags.delete(key);
    }
    params.set('ff', Array.from(bulkFlags).join(','));
  }

  const newUrl = `${location.pathname}?${params.toString()}${location.hash}`;
  history.replaceState(null, '', newUrl);
}

/**
 * Resets all feature flag-related URL search params.
 */
function resetUrlSearchParams() {
  const params = new URLSearchParams(location.search);

  params.delete('ff');
  Array.from(params.keys()).forEach((key) => {
    if (key.startsWith('ff_')) {
      params.delete(key);
    }
  });

  const newUrl = `${location.pathname}?${params.toString()}${location.hash}`;
  history.replaceState(null, '', newUrl);
}

/**
 * Feature flags are stored in localStorage and can be overridden by URL params.
 * The URL params take precedence over localStorage.
 * The localStorage is used to persist the flags across sessions.
 * The URL params are used to override the flags for a single session.
 * The flags are stored in the format:
 * - ?ff=flag1,flag2
 * - ?ff_flag3=true
 * - ?ff_flag4=false
 * The flags are stored in localStorage in the format:
 * - __ff_overrides__ = {"flag1": true, "flag2": false}
 */

let state: FlagState = compose(location.search);
const subs = new Set<() => void>();

export const FeatureFlagsStore = {
  get state() {
    return state;
  },
  isOn(key: FlagKey) {
    return state[key];
  },
  set(key: FlagKey, value: boolean) {
    if (state[key] === value) {
      return;
    }
    const next = { ...state, [key]: value };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    updateUrlSearchParams(key, value);
    state = compose(location.search);
    subs.forEach((fn) => fn());
  },
  resetAll() {
    resetUrlSearchParams();
    localStorage.removeItem(LS_KEY);

    state = compose(location.search);
    subs.forEach((fn) => fn());
  },
  refresh(search = location.search) {
    state = compose(search);
    subs.forEach((fn) => fn());
  },
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  },
};

import { createKeyedJSONStorage } from '~/shared/utils';
import {
  type ConditionKey,
  type ConditionState,
  evaluateConditions,
  guardSatisfied,
} from './conditions';
import { FLAGS, FlagKey } from './flags';

type FlagState = Record<FlagKey, boolean>;
const FLAGS_LOCAL_STORAGE_KEY = '__ff_overrides__';
const CONDITIONS_LOCAL_STORAGE_KEY = '__ff_conditions__';

const flagsLocalStorage = createKeyedJSONStorage(FLAGS_LOCAL_STORAGE_KEY, 'localStorage');
const conditionsLocalStorage = createKeyedJSONStorage(CONDITIONS_LOCAL_STORAGE_KEY, 'localStorage');

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
  return flagsLocalStorage.get({});
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

const applyGuards = (
  state: Record<FlagKey, boolean>,
  conds: ConditionState,
): Record<FlagKey, boolean> => {
  return Object.keys(FLAGS).reduce(
    (acc, key: FlagKey) => {
      const g = FLAGS[key].guard;
      if (g && !guardSatisfied(g, conds)) {
        acc[key] = false;
      }
      return acc;
    },
    { ...state },
  );
};

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
const _conditions: ConditionState = conditionsLocalStorage.get({});
let _state: FlagState = applyGuards(compose(location.search), _conditions);
const subs = new Set<() => void>();

const notify = () => {
  subs.forEach((fn) => fn());
};

export const FeatureFlagsStore = {
  get state() {
    return _state;
  },

  get conditions() {
    return _conditions;
  },

  isOn(key: FlagKey) {
    return _state[key];
  },

  async ensureConditions(keys: ConditionKey[], ctx = {}) {
    const fresh = await evaluateConditions(keys, ctx);

    // Merge; detect if any condition actually changed
    let condsChanged = false;
    for (const k of Object.keys(fresh) as ConditionKey[]) {
      if (_conditions[k] !== fresh[k]) {
        _conditions[k] = fresh[k];
        condsChanged = true;
      }
    }
    if (!condsChanged) return;

    // Persist for next boot
    conditionsLocalStorage.set(_conditions);

    // Re-apply guards and notify only if flags changed
    const next = applyGuards(compose(location.search), _conditions);
    let flagsChanged = false;
    for (const k of Object.keys(next) as FlagKey[]) {
      if (next[k] !== _state[k]) {
        flagsChanged = true;
        break;
      }
    }
    if (flagsChanged) {
      _state = next;
      notify();
    }
  },

  set(key: FlagKey, value: boolean) {
    if (_state[key] === value) {
      return;
    }
    const next = { ..._state, [key]: value };
    flagsLocalStorage.set(next);
    updateUrlSearchParams(key, value);
    _state = applyGuards(compose(location.search), _conditions);
    notify();
  },
  resetAll() {
    resetUrlSearchParams();
    flagsLocalStorage.remove();

    _state = applyGuards(compose(location.search), _conditions);
    notify();
  },
  refresh(search = location.search) {
    _state = applyGuards(compose(search), _conditions);
    notify();
  },
  subscribe(cb: () => void) {
    subs.add(cb);
    return () => {
      subs.delete(cb);
    };
  },
};

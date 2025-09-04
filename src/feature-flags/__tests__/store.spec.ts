/**
 * Tests for Feature Flags store.
 *
 * Detected testing framework: (filled by repository config) — this spec uses the Jest/Vitest compatible APIs:
 * - describe/it/expect
 * - jest.fn or vi.fn; we guard based on global availability.
 *
 * Focus: behavior covered by recent diff surrounding:
 * - URL parsing and synchronization (?ff and ff_<key> params)
 * - localStorage-backed overrides via createKeyedJSONStorage
 * - guards application through guardSatisfied and conditions via evaluateConditions
 * - store lifecycle: state/conditions/isOn/set/resetAll/refresh/subscribe/ensureConditions
 */

type AnyFn = (...args: unknown[]) => unknown;
// Unify jest/vi APIs without importing test runner specific modules

const mockFn: (impl?: AnyFn) => AnyFn =
  // @ts-expect-error
  (typeof vi !== 'undefined' && typeof vi.fn === 'function')
    // @ts-expect-error
    ? (impl?: AnyFn) => (vi.fn as unknown as (impl?: AnyFn) => AnyFn)(impl)
    // @ts-expect-error
    : (impl?: AnyFn) => (jest.fn as unknown as (impl?: AnyFn) => AnyFn)(impl);

const doMock =
  // @ts-expect-error
  (typeof vi !== 'undefined' && typeof vi.mock === 'function')
    // @ts-expect-error
    ? (id: string, factory: AnyFn) => vi.mock(id, factory)
    // @ts-expect-error
    : (id: string, factory: AnyFn) => (jest as unknown as { mock: (id: string, factory: AnyFn) => void }).mock(id, factory);

const resetModules =
  // @ts-expect-error
  typeof vi !== 'undefined' ? () => vi.resetModules() : () => jest.resetModules();

const clearAllMocks =
  // @ts-expect-error
  typeof vi !== 'undefined' ? () => vi.clearAllMocks() : () => jest.clearAllMocks();

const spyOnGlobalReplaceState = () => {
  // Spy on history.replaceState; both Jest and Vitest support spyOn
  const spy =
    // @ts-expect-error
    (typeof vi !== 'undefined' ? vi : jest).spyOn(history, 'replaceState');
  return spy;
};

const setWindowURL = (url: string) => {
  // Use history API to set current URL in jsdom-like environments
  history.replaceState(null, '', url);
};

const getSearchParams = () => new URLSearchParams(window.location.search);

//
// Module Mocks
//
type JSONStore<T> = {
  get(defaultValue: T): T;
  set(value: T): void;
  remove(): void;
};

type UtilsModule = {
  createKeyedJSONStorage: <T = Record<string, unknown>>(key: string, backend?: 'localStorage') => JSONStore<T>;
  __stores: Map<string, unknown>;
};

const __stores = new Map<string, unknown>();

doMock('~/shared/utils', () => {
  const createKeyedJSONStorage = <T = Record<string, unknown>>(key: string): JSONStore<T> => {
    if (!__stores.has(key)) {
      __stores.set(key, {});
    }
    return {
      get(defaultValue: T) {
        const v = __stores.get(key) as T | undefined;
        // Deep clone to avoid mutation in callers
        if (v && typeof v === 'object' && Object.keys(v as Record<string, unknown>).length) {
          return JSON.parse(JSON.stringify(v)) as T;
        }
        return defaultValue;
      },
      set(value: T) {
        __stores.set(key, JSON.parse(JSON.stringify(value)) as unknown);
      },
      remove() {
        __stores.delete(key);
      },
    };
  };
  return { createKeyedJSONStorage, __stores };
});

// Configurable mocks for conditions
let __nextConditions: Record<string, boolean> = {};
const __guardDecider = (guard: unknown, conds: Record<string, boolean>) => {
  if (!guard) return true;
  // Convention: guard = { id: string }
  if (typeof guard === 'object' && guard !== null && typeof (guard as { id?: unknown }).id === 'string') {
    return !!conds[(guard as { id: string }).id];
  }
  return true;
};

doMock('../conditions', () => {
  return {
    // types are erased at runtime; provide runtime fns only
    evaluateConditions: mockFn(async () => {
      return { ...__nextConditions };
    }),
    guardSatisfied: mockFn((guard: unknown, conds: Record<string, boolean>) => __guardDecider(guard, conds)),
  };
});

// FLAGS mock: keep it minimal but representative
const FLAGS_MOCK = {
  alpha: { defaultEnabled: false },                           // unguarded, default off
  beta:  { defaultEnabled: true, guard: { id: 'beta_ok' } },  // guarded, default on but depends on beta_ok
  gamma: { defaultEnabled: false, guard: { id: 'gamma_ok' } } // guarded, default off
} as const;

doMock('../flags', () => {
  return {
    FLAGS: FLAGS_MOCK,
  };
});

//
// Lazy import helpers to ensure mocks are applied before module evaluation
//
const importStore = async () => {
  resetModules();
  clearAllMocks();
  // Ensure default URL for each test
  setWindowURL('https://example.test/app?');
  // dynamic import after mocks
  const mod = await import('../store');
  return mod;
};

describe('parseUrlForFeatureFlags', () => {
  it('parses bulk ff param into individual true flags', async () => {
    const { parseUrlForFeatureFlags } = await importStore();
    const result = parseUrlForFeatureFlags('?ff=alpha,beta');
    // Cast to a typed record for flexible key assertions in tests
    expect((result as Record<string, boolean | undefined>).alpha).toBe(true);
    expect((result as Record<string, boolean | undefined>).beta).toBe(true);
    expect((result as Record<string, boolean | undefined>).gamma).toBeUndefined();
  });

  it('parses ff_<key> params with boolean semantics: anything except "false" is true', async () => {
    const { parseUrlForFeatureFlags } = await importStore();
    const result = parseUrlForFeatureFlags('?ff_alpha=false&ff_beta=true&ff_gamma=0');
    expect((result as Record<string, boolean | undefined>).alpha).toBe(false);
    expect((result as Record<string, boolean | undefined>).beta).toBe(true);
    // "0" => true because only exact "false" becomes false
    expect((result as Record<string, boolean | undefined>).gamma).toBe(true);
  });

  it('ff_<key> overrides bulk ff when both present', async () => {
    const { parseUrlForFeatureFlags } = await importStore();
    const result = parseUrlForFeatureFlags('?ff=alpha,gamma&ff_gamma=false');
    expect((result as Record<string, boolean | undefined>).alpha).toBe(true);
    expect((result as Record<string, boolean | undefined>).gamma).toBe(false);
  });
});

describe('FeatureFlagsStore - initialization and state composition', () => {
  it('uses precedence: URL > localStorage > default', async () => {
    // Setup initial URL and local storage entries via our mock
    setWindowURL('https://example.test/p?ff_alpha=true&ff_beta=false#frag');
    // Seed localStorage overrides (will be consulted by compose())
    const utils = await import('~/shared/utils') as unknown as UtilsModule;
    const flagsStore = utils.createKeyedJSONStorage('__ff_overrides__', 'localStorage');
    flagsStore.set({ alpha: false, beta: true, gamma: true });

    // Conditions initially empty (guards default to false-y via __guardDecider if id missing)
    __nextConditions = { 'beta_ok': true, 'gamma_ok': false };

    const { FeatureFlagsStore } = await importStore();
    // alpha -> URL true (overrides LS and default)
    // beta -> URL false despite guard ok => false
    // gamma -> no URL, LS true but guard false => forced false
    expect(FeatureFlagsStore.state.alpha).toBe(true);
    expect(FeatureFlagsStore.state.beta).toBe(false);
    expect(FeatureFlagsStore.state.gamma).toBe(false);
  });
});

describe('FeatureFlagsStore - guards and ensureConditions()', () => {
  it('applies guards: flips flags to false when guardSatisfied returns false', async () => {
    setWindowURL('https://example.test/app?ff=beta,gamma');
    __nextConditions = { 'beta_ok': false, 'gamma_ok': false };
    const { FeatureFlagsStore } = await importStore();

    expect(FeatureFlagsStore.isOn('beta')).toBe(false);
    expect(FeatureFlagsStore.isOn('gamma')).toBe(false);
  });

  it('recomputes flags and notifies subscribers only when flags actually change', async () => {
    setWindowURL('https://example.test/app?ff=beta');
    __nextConditions = { 'beta_ok': false, 'gamma_ok': false };
    const { FeatureFlagsStore } = await importStore();

    const cb = mockFn();
    const unsub = FeatureFlagsStore.subscribe(cb);

    // First: conditions change from false->true; beta flips from false to true => notify
    __nextConditions = { 'beta_ok': true, 'gamma_ok': false };
    await FeatureFlagsStore.ensureConditions(['beta_ok'], {});
    expect(cb).toHaveBeenCalledTimes(1);
    expect(FeatureFlagsStore.isOn('beta')).toBe(true);

    // Second: change unrelated condition; no flag changes => no notify
    __nextConditions = { 'beta_ok': true, 'gamma_ok': true }; // gamma remains off by default and URL not enabling it
    await FeatureFlagsStore.ensureConditions(['gamma_ok'], {});
    expect(cb).toHaveBeenCalledTimes(1); // unchanged

    unsub();
  });
});

describe('FeatureFlagsStore - set()', () => {
  it('persists to storage, updates URL, reapplies guards, and notifies once', async () => {
    setWindowURL('https://example.test/app?ff=alpha#x');
    __nextConditions = { 'beta_ok': true, 'gamma_ok': true };
    const { FeatureFlagsStore } = await importStore();

    const cb = mockFn();
    FeatureFlagsStore.subscribe(cb);

    const replaceSpy = spyOnGlobalReplaceState();

    // Turn off alpha (currently true via bulk URL)
    FeatureFlagsStore.set('alpha', false);

    // URL updated: ff_alpha=false and bulk 'ff' does not contain alpha anymore
    expect(replaceSpy).toHaveBeenCalled();
    const search = getSearchParams();
    expect(search.get('ff_alpha')).toBe('false');
    const bulk = search.get('ff') || '';
    expect(bulk.split(',').filter(Boolean)).not.toContain('alpha');

    // State reflects change
    expect(FeatureFlagsStore.isOn('alpha')).toBe(false);

    // Storage persisted
    const utils = await import('~/shared/utils') as unknown as UtilsModule;
    const store = utils.createKeyedJSONStorage('__ff_overrides__', 'localStorage');
    expect(store.get({})).toMatchObject({ alpha: false });

    // Notified
    expect(cb).toHaveBeenCalledTimes(1);

    // Setting same value again is a no-op
    cb.mockClear?.();
    replaceSpy.mockClear?.();
    FeatureFlagsStore.set('alpha', false);
    expect(cb).toHaveBeenCalledTimes(0);
    expect(replaceSpy).toHaveBeenCalledTimes(0);
  });
});

describe('FeatureFlagsStore - resetAll()', () => {
  it('clears URL ff params, removes storage, recomposes state, and notifies', async () => {
    setWindowURL('https://example.test/app?ff=alpha,beta&ff_gamma=false&other=42#h');
    __nextConditions = { 'beta_ok': false, 'gamma_ok': true };
    const { FeatureFlagsStore } = await importStore();
    const cb = mockFn();
    FeatureFlagsStore.subscribe(cb);

    const replaceSpy = spyOnGlobalReplaceState();

    // Precondition: flags reflect URL and guards
    expect(FeatureFlagsStore.isOn('alpha')).toBe(true);
    expect(FeatureFlagsStore.isOn('beta')).toBe(false); // guard false
    expect(FeatureFlagsStore.isOn('gamma')).toBe(false); // ff_gamma=false

    FeatureFlagsStore.resetAll();

    // URL no longer contains ff params
    const params = getSearchParams();
    expect(Array.from(params.keys()).some(k => k === 'ff' || k.startsWith('ff_'))).toBe(false);
    expect(replaceSpy).toHaveBeenCalled();

    // Storage removed
    const utils = await import('~/shared/utils') as unknown as UtilsModule;
    const storesMap: Map<string, unknown> = utils.__stores;
    expect(storesMap.has('__ff_overrides__')).toBe(false);

    // State recomposed from defaults + guards
    expect(FeatureFlagsStore.isOn('alpha')).toBe(false); // default off
    expect(FeatureFlagsStore.isOn('beta')).toBe(false);  // default on but guard still false -> forced off
    expect(FeatureFlagsStore.isOn('gamma')).toBe(false); // default off

    expect(cb).toHaveBeenCalled();
  });
});

describe('FeatureFlagsStore - refresh()', () => {
  it('recomputes state from provided search string and notifies', async () => {
    setWindowURL('https://example.test/app?');
    __nextConditions = { 'beta_ok': true, 'gamma_ok': true };
    const { FeatureFlagsStore } = await importStore();
    const cb = mockFn();
    FeatureFlagsStore.subscribe(cb);

    FeatureFlagsStore.refresh('?ff_alpha=false&ff=beta');

    expect(FeatureFlagsStore.isOn('alpha')).toBe(false);
    expect(FeatureFlagsStore.isOn('beta')).toBe(true);
    expect(cb).toHaveBeenCalled();
  });
});

describe('FeatureFlagsStore - subscribe()', () => {
  it('unsubscribe stops receiving notifications', async () => {
    const { FeatureFlagsStore } = await importStore();
    const cb = mockFn();
    const unsub = FeatureFlagsStore.subscribe(cb);

    FeatureFlagsStore.refresh('?ff=alpha');
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    FeatureFlagsStore.refresh('?ff=beta');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
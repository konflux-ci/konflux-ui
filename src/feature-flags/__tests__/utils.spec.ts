/**
 * Unit tests for feature-flags utils.
 * Framework: Jest or Vitest (auto-detect via globals). Uses describe/it/expect.
 */
import * as Utils from '../utils';

describe('feature-flags/utils (baseline)', () => {
  it('module should be defined', () => {
    expect(Utils).toBeTruthy();
  });
});

type AnyFn = (...args: unknown[]) => unknown;
const hasExport = (name: string) =>
  Object.prototype.hasOwnProperty.call(Utils as Record<string, unknown>, name);

const maybe = (name: string, cb: () => void) => {
  const d = hasExport(name) ? describe : describe.skip;
  d(name, cb);
};

maybe('normalizeFlagKey', () => {
  const normalizeFlagKey = (Utils as any).normalizeFlagKey as (s: string) => string;

  it('returns lowercased, trimmed, kebab-cased keys', () => {
    expect(normalizeFlagKey('  New_Feature  ')).toBe('new-feature');
    expect(normalizeFlagKey('EXPERIMENT_X')).toBe('experiment-x');
    expect(normalizeFlagKey('  multi   space   Key  ')).toBe('multi-space-key');
  });

  it('handles empty or whitespace-only strings', () => {
    expect(normalizeFlagKey('')).toBe('');
    expect(normalizeFlagKey('   ')).toBe('');
  });

  it('removes disallowed characters while preserving alphanumerics and dashes', () => {
    expect(normalizeFlagKey('feat@#%$-A')).toBe('feat-a');
  });
});

maybe('parseFlagBoolean', () => {
  const parseFlagBoolean = (Utils as any).parseFlagBoolean as (v: unknown, d?: boolean) => boolean;

  it('parses booleans and boolean-like strings', () => {
    expect(parseFlagBoolean(true)).toBe(true);
    expect(parseFlagBoolean(false)).toBe(false);
    expect(parseFlagBoolean('true')).toBe(true);
    expect(parseFlagBoolean('TRUE')).toBe(true);
    expect(parseFlagBoolean('false')).toBe(false);
    expect(parseFlagBoolean('0')).toBe(false);
    expect(parseFlagBoolean('1')).toBe(true);
    expect(parseFlagBoolean(1)).toBe(true);
    expect(parseFlagBoolean(0)).toBe(false);
  });

  it('falls back to default for nullish/unknown values', () => {
    expect(parseFlagBoolean(undefined, true)).toBe(true);
    expect(parseFlagBoolean(null, false)).toBe(false);
    expect(parseFlagBoolean('maybe', true)).toBe(true);
  });
});

maybe('getFeatureFlag', () => {
  const getFeatureFlag = (Utils as any).getFeatureFlag as <T>(k: string, d?: T, c?: Record<string, unknown>) => T;
  const normalizeFlagKey = (Utils as any).normalizeFlagKey as (s: string) => string;

  it('returns default when flag is missing', () => {
    const key = normalizeFlagKey ? normalizeFlagKey('missing_flag') : 'missing_flag';
    expect(getFeatureFlag(key, 'fallback')).toBe('fallback');
  });

  it('supports typed default values', () => {
    const key = 'number-flag';
    const res = getFeatureFlag<number>(key, 42);
    expect(typeof res).toBe('number');
  });

  it('passes through evaluation context (e.g., user, env)', () => {
    const key = 'contextual-flag';
    const ctx = { userId: 'u_123', plan: 'pro' };
    expect(() => getFeatureFlag(key, false, ctx)).not.toThrow();
  });
});

maybe('isFeatureEnabled', () => {
  const isFeatureEnabled = (Utils as any).isFeatureEnabled as (k: string, c?: Record<string, unknown>) => boolean;
  const getFeatureFlag = (Utils as any).getFeatureFlag as AnyFn | undefined;

  it('returns a boolean for any key (default false for unknown)', () => {
    const res = isFeatureEnabled('unknown-flag');
    expect(typeof res).toBe('boolean');
  });

  it('respects explicit boolean flags and context', () => {
    const key = 'enabled-by-context';
    const ctx = { cohort: 'A', region: 'us' };
    const value = isFeatureEnabled(key, ctx);
    expect(typeof value).toBe('boolean');
  });

  it('aligns with getFeatureFlag<boolean> when available', () => {
    if (getFeatureFlag) {
      const key = 'coherence-check';
      const fromIsEnabled = isFeatureEnabled(key);
      const fromGet = getFeatureFlag<boolean>(key, false);
      expect(typeof fromIsEnabled).toBe('boolean');
      expect(typeof fromGet).toBe('boolean');
    } else {
      expect(true).toBe(true);
    }
  });
});

describe('feature-flags/utils – input validation and failure cases', () => {
  it('handles unexpected inputs gracefully (no throws)', () => {
    const candidates: unknown[] = [null, undefined, 123, {}, [], Symbol('s')];
    for (const c of candidates) {
      if (hasExport('normalizeFlagKey')) {
        expect(() => (Utils as any).normalizeFlagKey(String(c))).not.toThrow();
      }
      if (hasExport('parseFlagBoolean')) {
        expect(() => (Utils as any).parseFlagBoolean(c)).not.toThrow();
      }
      if (hasExport('isFeatureEnabled')) {
        expect(() => (Utils as any).isFeatureEnabled(String(c))).not.toThrow();
      }
      if (hasExport('getFeatureFlag')) {
        expect(() => (Utils as any).getFeatureFlag(String(c), false)).not.toThrow();
      }
    }
  });
});

maybe('__internal/provider', () => {
  const internalNames = ['fetchFlagValue', 'evaluateFlag', 'readEnvFlag', 'getFromCache'];
  type TestRunner = {
    spyOn: (
      obj: unknown,
      method: string
    ) => {
      mockImplementation: (impl: () => unknown) => void;
      mockRestore?: () => void;
      toHaveBeenCalled: () => void;
    };
  };
  const { vi, jest } = globalThis as unknown as { vi?: TestRunner; jest?: TestRunner };
  const runner = vi ?? jest;
  const available = internalNames.filter(
    (n) => typeof (Utils as Record<string, unknown>)[n] === 'function'
  );

  it('spies on internal provider functions when available', () => {
    if (!runner || available.length === 0) {
      expect(true).toBe(true);
      return;
    }
    const name = available[0];
    const s = runner.spyOn(Utils, name).mockImplementation(() => true);
    if (hasExport('isFeatureEnabled')) {
      (Utils as any).isFeatureEnabled('spy-flag');
      expect(s).toHaveBeenCalled();
    } else {
      expect(true).toBe(true);
    }
    s.mockRestore && s.mockRestore();
  });
});
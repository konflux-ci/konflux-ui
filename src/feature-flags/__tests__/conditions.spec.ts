/**
 * Tests for feature-flags conditions utilities.
 *
 * Framework: Jest/Vitest (Jest-style APIs).
 * - Uses fake timers and mocked Date.now to validate TTL caching behavior.
 * - Validates concurrency, caching, error handling, guard combination logic, and invalidation.
 */
import {
  registerCondition,
  invalidateConditions,
  evaluateConditions,
  guardSatisfied,
  type ConditionKey,
  type ConditionState,
  type GuardSpec,
} from '@/feature-flags/conditions';

type TimerAPI = {
  advanceTimersByTimeAsync?: (ms: number) => Promise<void>;
  advanceTimersByTime?: (ms: number) => void;
  useFakeTimers?: (config?: unknown) => void;
  setSystemTime?: (d: number | Date) => void;
  useRealTimers?: () => void;
};

type GlobalTimer = {
  jest?: TimerAPI;
  vi?: TimerAPI;
};

const KUBE: ConditionKey = 'isKubearchiveEnabled';
const STAGING: ConditionKey = 'isStagingCluster';

// Helper: advance mocked time by ms
async function tickBy(ms: number) {
  // Support both Jest and Vitest timers
  const g = globalThis as unknown as GlobalTimer;
  if (g.jest?.advanceTimersByTimeAsync) {
    await g.jest.advanceTimersByTimeAsync(ms);
  } else if (g.jest?.advanceTimersByTime) {
    g.jest.advanceTimersByTime(ms);
    // Allow microtasks to flush
    await Promise.resolve();
  } else if (g.vi?.advanceTimersByTimeAsync) {
    await g.vi.advanceTimersByTimeAsync(ms);
  } else if (g.vi?.advanceTimersByTime) {
    g.vi.advanceTimersByTime(ms);
    await Promise.resolve();
  } else {
    // As a fallback, don't rely on timers; Date.now will still be mocked
    await Promise.resolve();
  }
}

describe('feature-flags/conditions', () => {
  // Choose correct timer API across Jest/Vitest
  const enableFakeTimers = () => {
    const g = globalThis as unknown as GlobalTimer;
    const jf = g.jest?.useFakeTimers;
    if (jf) jf({ legacyFakeTimers: false });
    const vf = g.vi?.useFakeTimers;
    if (vf) vf();
  };
  const setSystemTime = (d: number | Date) => {
    const g = globalThis as unknown as GlobalTimer;
    const jst = g.jest?.setSystemTime;
    if (jst) jst(d);
    const vst = g.vi?.setSystemTime;
    if (vst) vst(d);
  };
  const restoreRealTimers = () => {
    const g = globalThis as unknown as GlobalTimer;
    const jr = g.jest?.useRealTimers;
    if (jr) jr();
    const vr = g.vi?.useRealTimers;
    if (vr) vr();
  };

  beforeEach(() => {
    // Invalidate all cached entries and inflight promises across tests
    invalidateConditions();
  });

  afterEach(() => {
    restoreRealTimers();
    // Final invalidate to avoid cross-test state
    invalidateConditions();
  });

  describe('guardSatisfied', () => {
    test('returns true when guard is undefined', () => {
      expect(guardSatisfied(undefined, {})).toBe(true);
    });

    test('allOf only: true only if all conditions are true', () => {
      const guard: GuardSpec = { allOf: [KUBE, STAGING], reason: 'both', visible: false };
      const conds: ConditionState = { isKubearchiveEnabled: true, isStagingCluster: false };
      expect(guardSatisfied(guard, conds)).toBe(false);

      conds.isStagingCluster = true;
      expect(guardSatisfied(guard, conds)).toBe(true);
    });

    test('anyOf only: true if at least one is true', () => {
      const guard: GuardSpec = { anyOf: [KUBE, STAGING], reason: 'either', visible: true };
      expect(guardSatisfied(guard, { isKubearchiveEnabled: false, isStagingCluster: false })).toBe(false);
      expect(guardSatisfied(guard, { isKubearchiveEnabled: true, isStagingCluster: false })).toBe(true);
      expect(guardSatisfied(guard, { isKubearchiveEnabled: false, isStagingCluster: true })).toBe(true);
    });

    test('combination: allOf AND anyOf must both be satisfied', () => {
      const guard: GuardSpec = {
        allOf: [KUBE],
        anyOf: [STAGING],
        reason: 'combo',
        visible: false,
      };
      expect(guardSatisfied(guard, { isKubearchiveEnabled: true, isStagingCluster: false })).toBe(false);
      expect(guardSatisfied(guard, { isKubearchiveEnabled: false, isStagingCluster: true })).toBe(false);
      expect(guardSatisfied(guard, { isKubearchiveEnabled: true, isStagingCluster: true })).toBe(true);
    });
  });

  describe('registerCondition + evaluateConditions', () => {
    test('missing registry entries resolve to false', async () => {
      const out = await evaluateConditions([KUBE, STAGING]);
      expect(out).toEqual({
        isKubearchiveEnabled: false,
        isStagingCluster: false,
      });
    });

    test('evaluates resolvers and returns booleans; caches with TTL', async () => {
      enableFakeTimers();
      setSystemTime(new Date('2025-01-01T00:00:00Z'));

      let callsK = 0;
      let callsS = 0;
      registerCondition(KUBE, async () => {
        callsK++;
        return true;
      }, 1000);
      registerCondition(STAGING, async () => {
        callsS++;
        return false;
      }, 1000);

      const first = await evaluateConditions([KUBE, STAGING]);
      expect(first).toEqual({ isKubearchiveEnabled: true, isStagingCluster: false });
      expect(callsK).toBe(1);
      expect(callsS).toBe(1);

      // Within TTL -> cached, no new resolver calls
      const second = await evaluateConditions([KUBE, STAGING]);
      expect(second).toEqual(first);
      expect(callsK).toBe(1);
      expect(callsS).toBe(1);

      // After TTL -> should call resolvers again
      await tickBy(1001);
      const third = await evaluateConditions([KUBE, STAGING]);
      expect(third).toEqual(first);
      expect(callsK).toBe(2);
      expect(callsS).toBe(2);
    });

    test('inflight de-dup: concurrent evaluations share the same promise', async () => {
      enableFakeTimers();
      setSystemTime(new Date('2025-01-01T00:00:00Z'));

      let calls = 0;
      let resolveFn: ((v: boolean) => void) | null = null;

      registerCondition(KUBE, () => {
        calls++;
        return new Promise<boolean>((res) => {
          resolveFn = res;
        });
      }, 1000);

      // Fire two concurrent evaluations for the same key
      const p1 = evaluateConditions([KUBE]);
      const p2 = evaluateConditions([KUBE]);

      // Resolve the inflight promise
      resolveFn?.(true);

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toEqual({ isKubearchiveEnabled: true });
      expect(r2).toEqual({ isKubearchiveEnabled: true });
      // Resolver should have been called only once due to inflight de-dup
      expect(calls).toBe(1);

      // Immediately call again within TTL -> no new call
      const r3 = await evaluateConditions([KUBE]);
      expect(r3).toEqual({ isKubearchiveEnabled: true });
      expect(calls).toBe(1);
    });

    test('resolver exceptions are caught and cached as false', async () => {
      enableFakeTimers();
      setSystemTime(new Date('2025-01-01T00:00:00Z'));

      let calls = 0;
      registerCondition(STAGING, async () => {
        calls++;
        throw new Error('boom');
      }, 500);

      const r1 = await evaluateConditions([STAGING]);
      expect(r1).toEqual({ isStagingCluster: false });
      expect(calls).toBe(1);

      // Within TTL -> use cached false, no extra calls
      const r2 = await evaluateConditions([STAGING]);
      expect(r2).toEqual({ isStagingCluster: false });
      expect(calls).toBe(1);

      // After TTL -> call again and still fail -> still false
      await tickBy(501);
      const r3 = await evaluateConditions([STAGING]);
      expect(r3).toEqual({ isStagingCluster: false });
      expect(calls).toBe(2);
    });

    test('invalidateConditions clears cache and inflight only for specified keys', async () => {
      enableFakeTimers();
      setSystemTime(new Date('2025-01-01T00:00:00Z'));

      let kCalls = 0;
      let sCalls = 0;

      registerCondition(KUBE, async () => {
        kCalls++;
        return true;
      }, 60000);

      registerCondition(STAGING, async () => {
        sCalls++;
        return true;
      }, 60000);

      const a = await evaluateConditions([KUBE, STAGING]);
      expect(a).toEqual({ isKubearchiveEnabled: true, isStagingCluster: true });
      expect(kCalls).toBe(1);
      expect(sCalls).toBe(1);

      // Invalidate only KUBE -> next call should re-run KUBE resolver but not STAGING
      invalidateConditions([KUBE]);

      const b = await evaluateConditions([KUBE, STAGING]);
      expect(b).toEqual({ isKubearchiveEnabled: true, isStagingCluster: true });
      expect(kCalls).toBe(2);
      expect(sCalls).toBe(1);
    });

    test('registerCondition is idempotent when called multiple times with same key', async () => {
      // Initial registration
      let calls = 0;
      const resolver = async () => {
        calls++;
        return true;
      };
      registerCondition(KUBE, resolver, 0);
      // Attempt to re-register with a different resolver; expected: no override
      let altCalls = 0;
      const altResolver = async () => {
        altCalls++;
        return false;
      };
      registerCondition(KUBE, altResolver, 0);

      const r = await evaluateConditions([KUBE]);
      expect(r.isKubearchiveEnabled).toBe(true);
      expect(calls).toBe(1);
      expect(altCalls).toBe(0);
    });

    test('evaluateConditions forwards ctx to resolver', async () => {
      type Ctx = { expected: boolean };
      registerCondition(KUBE, async (ctx?: Ctx) => {
        return !!ctx?.expected;
      }, 0);

      const outTrue = await evaluateConditions<Ctx>([KUBE], { expected: true });
      expect(outTrue).toEqual({ isKubearchiveEnabled: true });

      const outFalse = await evaluateConditions<Ctx>([KUBE], { expected: false });
      expect(outFalse).toEqual({ isKubearchiveEnabled: false });
    });
  });
});
/**
 * Tests for feature-flags utils.
 * Framework note: This suite supports both Vitest and Jest.
 *  - If using Vitest: vi is available.
 *  - If using Jest: we alias vi to jest below for compatibility.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as FlagsModule from '../flags';
import type { ConditionKey } from '../conditions';
import { HttpError } from '~/k8s/error';
import * as StoreModule from '../store';
import { isFeatureFlagOn, ensureFeatureFlagOnLoader, getAllConditionsKeysFromFlags, ensureConditionIsOn } from '../utils';

// Alias vi to jest if running under Jest to keep tests portable
// @ts-expect-error
// eslint-disable-next-line no-var
declare var vi: any;
// @ts-expect-error
// eslint-disable-next-line no-var
declare var jest: any;
// @ts-expect-error
const mocker = typeof vi !== 'undefined' ? vi : (typeof jest !== 'undefined' ? jest : undefined);
if (!mocker) {
  throw new Error('No test mocking framework detected (expected Vitest or Jest).');
}

describe('feature-flags/utils', () => {
  afterEach(() => {
    mocker.restoreAllMocks?.();
    mocker.resetAllMocks?.();
    mocker.clearAllMocks?.();
  });

  describe('isFeatureFlagOn', () => {
    it('returns true when FeatureFlagsStore.isOn returns true', () => {
      const spy = mocker.spyOn(StoreModule.FeatureFlagsStore, 'isOn').mockReturnValue(true);
      // @ts-expect-error using arbitrary flag key for testing
      expect(isFeatureFlagOn('any-flag')).toBe(true);
      expect(spy).toHaveBeenCalledWith('any-flag');
    });

    it('returns false when FeatureFlagsStore.isOn returns false', () => {
      mocker.spyOn(StoreModule.FeatureFlagsStore, 'isOn').mockReturnValue(false);
      // @ts-expect-error using arbitrary flag key for testing
      expect(isFeatureFlagOn('other-flag')).toBe(false);
    });
  });

  describe('ensureFeatureFlagOnLoader', () => {
    it('does not throw when flag is ON', () => {
      mocker.spyOn(StoreModule.FeatureFlagsStore, 'isOn').mockReturnValue(true);
      // @ts-expect-error test flag
      expect(() => ensureFeatureFlagOnLoader('flag-on')).not.toThrow();
    });

    it('throws HttpError 404 when flag is OFF', () => {
      mocker.spyOn(StoreModule.FeatureFlagsStore, 'isOn').mockReturnValue(false);
      const errFromCode = mocker.spyOn(HttpError, 'fromCode');
      // @ts-expect-error test flag
      expect(() => ensureFeatureFlagOnLoader('flag-off')).toThrow();
      expect(errFromCode).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllConditionsKeysFromFlags', () => {
    const restoreFlags = () => {
      mocker.restoreAllMocks?.();
    };

    afterEach(restoreFlags);

    it('collects unique keys from guard.allOf and guard.anyOf across all flags', () => {
      // Arrange FLAGS with duplicates and mix of allOf/anyOf
      const FLAGS_MOCK: any = {
        a: { guard: { allOf: ['c1' as ConditionKey, 'c2' as ConditionKey], anyOf: ['c3' as ConditionKey] } },
        b: { guard: { allOf: ['c2' as ConditionKey], anyOf: ['c3' as ConditionKey, 'c4' as ConditionKey] } },
        c: { guard: undefined },
      };
      mocker.spyOn(FlagsModule, 'FLAGS', 'get').mockReturnValue(FLAGS_MOCK);

      const keys = getAllConditionsKeysFromFlags();
      // Order is not guaranteed; compare as sets
      expect(new Set(keys)).toEqual(new Set(['c1', 'c2', 'c3', 'c4']));
    });

    it('ignores non-array guard properties gracefully', () => {
      const FLAGS_MOCK: any = {
        a: { guard: { allOf: 'not-an-array', anyOf: ['k1' as ConditionKey] } },
        b: { guard: { anyOf: 'also-not-array', allOf: ['k2' as ConditionKey] } },
        c: { /* no guard */ },
      };
      mocker.spyOn(FlagsModule, 'FLAGS', 'get').mockReturnValue(FLAGS_MOCK);

      const keys = getAllConditionsKeysFromFlags();
      expect(new Set(keys)).toEqual(new Set(['k1', 'k2']));
    });

    it('returns empty array when no guards are present', () => {
      const FLAGS_MOCK: any = { a: {}, b: {}, c: {} };
      mocker.spyOn(FlagsModule, 'FLAGS', 'get').mockReturnValue(FLAGS_MOCK);

      expect(getAllConditionsKeysFromFlags()).toEqual([]);
    });
  });

  describe('ensureConditionIsOn', () => {
    it('returns a predicate that is true only if all specified conditions are true', () => {
      const conditions: Record<string, boolean> = { c1: true, c2: true, c3: false };
      mocker.spyOn(StoreModule.FeatureFlagsStore, 'conditions', 'get').mockReturnValue(conditions as any);

      const predicate = ensureConditionIsOn(['c1' as ConditionKey, 'c2' as ConditionKey]);
      expect(predicate()).toBe(true);

      const predicate2 = ensureConditionIsOn(['c1' as ConditionKey, 'c3' as ConditionKey]);
      expect(predicate2()).toBe(false);
    });

    it('treats missing/undefined conditions as false', () => {
      const conditions: Record<string, boolean> = { c1: true };
      mocker.spyOn(StoreModule.FeatureFlagsStore, 'conditions', 'get').mockReturnValue(conditions as any);

      const predicate = ensureConditionIsOn(['c1' as ConditionKey, 'missing' as ConditionKey]);
      expect(predicate()).toBe(false);
    });

    it('returns true for empty key list (vacuous truth)', () => {
      mocker.spyOn(StoreModule.FeatureFlagsStore, 'conditions', 'get').mockReturnValue({} as any);
      const predicate = ensureConditionIsOn([]);
      expect(predicate()).toBe(true);
    });

    it('reflects dynamic changes to FeatureFlagsStore.conditions on each invocation', () => {
      const conditions: Record<string, boolean> = { k1: false, k2: true };
      const getter = mocker.spyOn(StoreModule.FeatureFlagsStore, 'conditions', 'get')
        .mockReturnValue(conditions as any);

      const predicate = ensureConditionIsOn(['k1' as ConditionKey, 'k2' as ConditionKey]);
      expect(predicate()).toBe(false);

      // flip k1 at runtime; predicate reads from store each call
      conditions.k1 = true;
      getter.mockReturnValueOnce(conditions as any);
      expect(predicate()).toBe(true);
    });
  });
});
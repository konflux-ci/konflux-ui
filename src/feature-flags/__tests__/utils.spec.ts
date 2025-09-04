/**
 * Test framework: Vitest
 * Scope: src/feature-flags/utils.ts
 * Notes:
 * - We mock './flags', './store', and '~/k8s/error' as needed.
 * - We validate happy paths, edge cases (empty guards, duplicates), and failure conditions (404).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Mock modules first
vi.mock('../flags', () => {
  // Default FLAGS used only in tests that don't override via vi.doMock
  const FLAGS = {
    featureA: { key: 'featureA', guard: { allOf: ['condA'] } },
    featureB: { key: 'featureB', guard: { anyOf: ['condB', 'condC'] } },
    featureNoGuard: { key: 'featureNoGuard' },
  } as const;
  return { FLAGS };
});
vi.mock('../store', () => {
  return {
    FeatureFlagsStore: {
      isOn: vi.fn(() => false),
      conditions: {} as Record<string, boolean>,
    },
  };
});
vi.mock('~/k8s/error', () => {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message?: string) {
      super(message ?? `HTTP ${status}`);
      this.name = 'HttpError';
      this.status = status;
    }
    static fromCode(code: number) {
      return new HttpError(code);
    }
  }
  return { HttpError };
});

import { FeatureFlagsStore } from '../store';
import {
  isFeatureFlagOn,
  ensureFeatureFlagOnLoader,
  getAllConditionsKeysFromFlags,
  ensureConditionIsOn,
} from '../utils';

describe('feature-flags/utils', () => {
  beforeEach(() => {
    // Reset spies and default state
    vi.clearAllMocks();
    FeatureFlagsStore.isOn.mockReturnValue(false);
    FeatureFlagsStore.conditions = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isFeatureFlagOn', () => {
    it('returns true when FeatureFlagsStore.isOn returns true (happy path)', () => {
      FeatureFlagsStore.isOn.mockReturnValue(true);
      expect(isFeatureFlagOn('featureA')).toBe(true);
      expect(FeatureFlagsStore.isOn).toHaveBeenCalledWith('featureA');
    });

    it('returns false when FeatureFlagsStore.isOn returns false', () => {
      FeatureFlagsStore.isOn.mockReturnValue(false);
      expect(isFeatureFlagOn('featureB')).toBe(false);
      expect(FeatureFlagsStore.isOn).toHaveBeenCalledWith('featureB');
    });
  });

  describe('ensureFeatureFlagOnLoader', () => {
    it('does nothing (no throw) when flag is ON', () => {
      FeatureFlagsStore.isOn.mockReturnValue(true);
      expect(() => ensureFeatureFlagOnLoader('featureA')).not.toThrow();
    });

    it('throws HttpError with 404 when flag is OFF (failure condition)', () => {
      FeatureFlagsStore.isOn.mockReturnValue(false);
      expect(() => ensureFeatureFlagOnLoader('featureA')).toThrowErrorMatchingObject({
        name: 'HttpError',
        status: 404,
      });
    });
  });

  describe('getAllConditionsKeysFromFlags', () => {
    it('collects unique keys from allOf and anyOf across all flags (happy path)', () => {
      const keys = getAllConditionsKeysFromFlags();
      // From default mock: condA, condB, condC
      expect(keys.sort()).toEqual(['condA', 'condB', 'condC'].sort());
    });

    it('ignores flags without guards (edge case)', async () => {
      // Using default FLAGS which includes featureNoGuard
      const keys = getAllConditionsKeysFromFlags();
      expect(keys).not.toContain('featureNoGuard');
    });

    it('deduplicates repeated condition keys (edge case)', async () => {
      // Temporarily override FLAGS for this test
      vi.doMock('../flags', () => {
        return {
          FLAGS: {
            f1: { key: 'f1', guard: { allOf: ['x', 'y', 'x'] } },
            f2: { key: 'f2', guard: { anyOf: ['y', 'z', 'z'] } },
          },
        };
      });
      // Re-import utils with overridden module graph
      const { getAllConditionsKeysFromFlags: reloaded } = await import('../utils');
      const keys = reloaded();
      expect(keys.sort()).toEqual(['x', 'y', 'z'].sort());
    });
  });

  describe('ensureConditionIsOn', () => {
    it('returns a function that yields true when all conditions are ON', () => {
      FeatureFlagsStore.conditions = { condA: true, condB: true };
      const allOn = ensureConditionIsOn(['condA', 'condB']);
      expect(allOn()).toBe(true);
    });

    it('returns false if any condition is OFF', () => {
      FeatureFlagsStore.conditions = { condA: true, condB: false };
      const checker = ensureConditionIsOn(['condA', 'condB']);
      expect(checker()).toBe(false);
    });

    it('returns true for empty condition list (edge case)', () => {
      FeatureFlagsStore.conditions = {};
      const checker = ensureConditionIsOn([]);
      expect(checker()).toBe(true);
    });

    it('handles missing keys gracefully (treated as falsy)', () => {
      FeatureFlagsStore.conditions = { condA: true }; // condB missing
      const checker = ensureConditionIsOn(['condA', 'condB']);
      expect(checker()).toBe(false);
    });
  });
});
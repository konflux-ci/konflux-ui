import { RunStatus } from '@patternfly/react-topology';
import { createStatusRegistry, CATEGORY_COLORS, CATEGORY_PF_RUN_STATUS } from '../status-registry';

// ---------------------------------------------------------------------------
// Test config — a small, self-contained status set for testing the factory
// ---------------------------------------------------------------------------

type TestStatus = 'Active' | 'Paused' | 'Done' | 'Error' | 'Unknown';

type TestResource = {
  state: string;
  reason?: string;
};

type TestContext = {
  isActive: boolean;
  isPaused: boolean;
  isDone: boolean;
  isError: boolean;
};

const createTestContext = (obj: TestResource): TestContext => ({
  isActive: obj.state === 'active',
  isPaused: obj.state === 'paused',
  isDone: obj.state === 'done',
  isError: obj.state === 'error',
});

const testRegistry = createStatusRegistry<TestStatus, TestResource, TestContext>()({
  createContext: createTestContext,
  statuses: [
    {
      status: 'Paused',
      match: (_obj, ctx) => ctx.isPaused,
      category: 'warning',
      weight: 30,
      label: 'On Hold',
      tags: ['unfinished'],
      reason: () => 'Paused by admin',
    },
    {
      status: 'Active',
      match: (_obj, ctx) => ctx.isActive,
      category: 'info',
      weight: 10,
      tags: ['unfinished', 'active'],
    },
    {
      status: 'Error',
      match: (_obj, ctx) => ctx.isError,
      category: 'danger',
      weight: 5,
      tags: ['terminal', 'error'],
      reason: (obj) => `Error: ${obj.reason ?? 'unknown'}`,
    },
    {
      status: 'Done',
      match: (_obj, ctx) => ctx.isDone,
      category: 'success',
      weight: 70,
      tags: ['terminal'],
    },
    {
      status: 'Unknown',
      match: () => true,
      category: 'neutral',
      weight: 90,
    },
  ],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createStatusRegistry', () => {
  describe('deriveStatus', () => {
    it('returns the first matching status in array order', () => {
      expect(testRegistry.deriveStatus({ state: 'active' })).toBe('Active');
      expect(testRegistry.deriveStatus({ state: 'paused' })).toBe('Paused');
      expect(testRegistry.deriveStatus({ state: 'done' })).toBe('Done');
      expect(testRegistry.deriveStatus({ state: 'error' })).toBe('Error');
    });

    it('falls back to the last status (catch-all) for unknown states', () => {
      expect(testRegistry.deriveStatus({ state: 'something-else' })).toBe('Unknown');
    });

    it('respects array order — first match wins', () => {
      // If a resource matched multiple predicates, the one earlier in the
      // array wins. We test this by having Paused before Active.
      // A resource that is both paused and active should be "Paused" because
      // Paused is at index 0 in the array.
      const ambiguousResource: TestResource = { state: 'paused' };
      expect(testRegistry.deriveStatus(ambiguousResource)).toBe('Paused');
    });
  });

  describe('accessors', () => {
    it('getEntry returns the full entry', () => {
      const entry = testRegistry.getEntry('Active');
      expect(entry).toBeDefined();
      expect(entry.category).toBe('info');
      expect(entry.weight).toBe(10);
    });

    it('getLabel returns the label override when present', () => {
      expect(testRegistry.getLabel('Paused')).toBe('On Hold');
    });

    it('getLabel falls back to the status key when no label override', () => {
      expect(testRegistry.getLabel('Active')).toBe('Active');
      expect(testRegistry.getLabel('Done')).toBe('Done');
    });

    it('getCategory returns the semantic category', () => {
      expect(testRegistry.getCategory('Active')).toBe('info');
      expect(testRegistry.getCategory('Error')).toBe('danger');
      expect(testRegistry.getCategory('Done')).toBe('success');
      expect(testRegistry.getCategory('Unknown')).toBe('neutral');
    });

    it('getWeight returns the sort weight', () => {
      expect(testRegistry.getWeight('Error')).toBe(5);
      expect(testRegistry.getWeight('Active')).toBe(10);
      expect(testRegistry.getWeight('Unknown')).toBe(90);
    });

    it('getColor returns the category hex color', () => {
      expect(testRegistry.getColor('Active')).toBe(CATEGORY_COLORS.info.hex);
      expect(testRegistry.getColor('Error')).toBe(CATEGORY_COLORS.danger.hex);
      expect(testRegistry.getColor('Done')).toBe(CATEGORY_COLORS.success.hex);
    });

    it('getColorName returns the category label color name', () => {
      expect(testRegistry.getColorName('Active')).toBe(CATEGORY_COLORS.info.name);
      expect(testRegistry.getColorName('Error')).toBe(CATEGORY_COLORS.danger.name);
    });

    it('getRunStatus returns the category PF RunStatus by default', () => {
      expect(testRegistry.getRunStatus('Active')).toBe(CATEGORY_PF_RUN_STATUS.info);
      expect(testRegistry.getRunStatus('Done')).toBe(CATEGORY_PF_RUN_STATUS.success);
    });
  });

  describe('tags', () => {
    it('hasTag returns true for matching tags', () => {
      expect(testRegistry.hasTag('Active', 'unfinished')).toBe(true);
      expect(testRegistry.hasTag('Active', 'active')).toBe(true);
      expect(testRegistry.hasTag('Error', 'error')).toBe(true);
    });

    it('hasTag returns false for non-matching tags', () => {
      expect(testRegistry.hasTag('Done', 'unfinished')).toBe(false);
      expect(testRegistry.hasTag('Unknown', 'terminal')).toBe(false);
    });

    it('hasTag returns false for statuses with no tags', () => {
      expect(testRegistry.hasTag('Unknown', 'anything')).toBe(false);
    });

    it('getStatusesByTag returns statuses with the given tag in weight order', () => {
      const unfinished = testRegistry.getStatusesByTag('unfinished');
      expect(unfinished).toEqual(['Active', 'Paused']);
      // Active weight=10 < Paused weight=30

      const terminal = testRegistry.getStatusesByTag('terminal');
      expect(terminal).toEqual(['Error', 'Done']);
      // Error weight=5 < Done weight=70
    });

    it('getStatusesByTag returns empty array for unknown tag', () => {
      expect(testRegistry.getStatusesByTag('nonexistent')).toEqual([]);
    });
  });

  describe('cached collections', () => {
    it('allStatuses returns statuses sorted by weight', () => {
      expect(testRegistry.allStatuses).toEqual([
        'Error', // 5
        'Active', // 10
        'Paused', // 30
        'Done', // 70
        'Unknown', // 90
      ]);
    });

    it('weightMap has an entry for every status', () => {
      expect(testRegistry.weightMap).toEqual({
        Active: 10,
        Paused: 30,
        Error: 5,
        Done: 70,
        Unknown: 90,
      });
    });
  });

  describe('createFilterFn', () => {
    const resources: TestResource[] = [
      { state: 'active' },
      { state: 'paused' },
      { state: 'done' },
      { state: 'error' },
      { state: 'other' },
    ];

    it('filters resources by derived status', () => {
      const filterFn = testRegistry.createFilterFn(['Active', 'Error']);
      const filtered = resources.filter(filterFn);
      expect(filtered).toEqual([{ state: 'active' }, { state: 'error' }]);
    });

    it('returns all resources when all statuses are selected', () => {
      const filterFn = testRegistry.createFilterFn([
        'Active',
        'Paused',
        'Done',
        'Error',
        'Unknown',
      ]);
      expect(resources.filter(filterFn)).toHaveLength(resources.length);
    });

    it('returns empty array when no statuses are selected', () => {
      const filterFn = testRegistry.createFilterFn([]);
      expect(resources.filter(filterFn)).toEqual([]);
    });

    it('uses deriveStatus (not individual predicates) for correctness', () => {
      // Unknown.match always returns true, but deriveStatus resolves "other"
      // to "Unknown" because it's the last in the array. Selecting only "Unknown"
      // should only match resources where deriveStatus returns "Unknown".
      const filterFn = testRegistry.createFilterFn(['Unknown']);
      const filtered = resources.filter(filterFn);
      expect(filtered).toEqual([{ state: 'other' }]);
    });
  });

  describe('getStatusConfigs', () => {
    it('returns configs sorted by weight', () => {
      const configs = testRegistry.getStatusConfigs();
      const statuses = configs.map((c) => c.status);
      expect(statuses).toEqual(['Error', 'Active', 'Paused', 'Done', 'Unknown']);
    });

    it('each config has display properties', () => {
      const configs = testRegistry.getStatusConfigs();
      for (const config of configs) {
        expect(config.status).toBeTruthy();
        expect(config.label).toBeTruthy();
        expect(config.color).toBeTruthy();
        expect(config.colorName).toBeTruthy();
        expect(config.runStatus).toBeDefined();
      }
    });

    it('excludes specified statuses', () => {
      const configs = testRegistry.getStatusConfigs(new Set(['Unknown']));
      expect(configs.find((c) => c.status === 'Unknown')).toBeUndefined();
      expect(configs).toHaveLength(4);
    });
  });

  describe('color overrides', () => {
    it('uses entry color override when provided', () => {
      const registryWithOverride = createStatusRegistry<'Custom', { x: number }>()({
        statuses: [
          {
            status: 'Custom',
            match: () => true,
            category: 'info',
            weight: 1,
            color: { hex: '#ff00ff', name: 'purple' },
          },
        ],
      });

      expect(registryWithOverride.getColor('Custom')).toBe('#ff00ff');
      expect(registryWithOverride.getColorName('Custom')).toBe('purple');
    });
  });

  describe('pfRunStatus override', () => {
    it('uses entry pfRunStatus override when provided', () => {
      const registryWithOverride = createStatusRegistry<'Custom', { x: number }>()({
        statuses: [
          {
            status: 'Custom',
            match: () => true,
            category: 'info',
            weight: 1,
            pfRunStatus: RunStatus.Idle,
          },
        ],
      });

      expect(registryWithOverride.getRunStatus('Custom')).toBe(RunStatus.Idle);
    });
  });

  describe('getReason', () => {
    it('returns the reason string when the matching entry has a reason fn', () => {
      expect(testRegistry.getReason({ state: 'paused' })).toBe('Paused by admin');
    });

    it('passes the resource and context to the reason fn', () => {
      expect(testRegistry.getReason({ state: 'error', reason: 'disk full' })).toBe(
        'Error: disk full',
      );
    });

    it('returns undefined when the matching entry has no reason fn', () => {
      expect(testRegistry.getReason({ state: 'active' })).toBeUndefined();
    });

    it('returns undefined for the catch-all entry with no reason', () => {
      expect(testRegistry.getReason({ state: 'something-else' })).toBeUndefined();
    });
  });

  describe('no context variant', () => {
    it('works without createContext', () => {
      type SimpleResource = { active: boolean };
      const simpleRegistry = createStatusRegistry<'On' | 'Off', SimpleResource>()({
        statuses: [
          { status: 'On', match: (obj) => obj.active, category: 'success', weight: 1 },
          { status: 'Off', match: () => true, category: 'neutral', weight: 2 },
        ],
      });

      expect(simpleRegistry.deriveStatus({ active: true })).toBe('On');
      expect(simpleRegistry.deriveStatus({ active: false })).toBe('Off');
    });
  });
});

describe('CATEGORY_COLORS', () => {
  it('has entries for all five categories', () => {
    expect(CATEGORY_COLORS.success).toBeDefined();
    expect(CATEGORY_COLORS.danger).toBeDefined();
    expect(CATEGORY_COLORS.warning).toBeDefined();
    expect(CATEGORY_COLORS.info).toBeDefined();
    expect(CATEGORY_COLORS.neutral).toBeDefined();
  });

  it('each entry has hex and name', () => {
    for (const entry of Object.values(CATEGORY_COLORS)) {
      expect(entry.hex).toBeTruthy();
      expect(entry.name).toBeTruthy();
    }
  });
});

describe('CATEGORY_PF_RUN_STATUS', () => {
  it('maps categories to RunStatus values', () => {
    expect(CATEGORY_PF_RUN_STATUS.success).toBe(RunStatus.Succeeded);
    expect(CATEGORY_PF_RUN_STATUS.danger).toBe(RunStatus.Failed);
    expect(CATEGORY_PF_RUN_STATUS.warning).toBe(RunStatus.Cancelled);
    expect(CATEGORY_PF_RUN_STATUS.info).toBe(RunStatus.Running);
    expect(CATEGORY_PF_RUN_STATUS.neutral).toBe(RunStatus.Pending);
  });
});

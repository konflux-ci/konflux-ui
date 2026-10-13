/**
 * Parity tests: PIPELINE_RUN_STATUS_REGISTRY.deriveStatus must produce
 * the same results as the existing `pipelineRunStatus` for every test fixture.
 *
 * Also tests the registry accessors directly.
 */

import { t_chart_color_green_100 as successColor } from '@patternfly/react-tokens/dist/js/t_chart_color_green_100';
import { t_global_color_brand_100 as infoColor } from '@patternfly/react-tokens/dist/js/t_global_color_brand_100';
import { t_global_color_severity_undefined_100 as neutralColor } from '@patternfly/react-tokens/dist/js/t_global_color_severity_undefined_100';
import { t_global_color_status_warning_100 as warningColor } from '@patternfly/react-tokens/dist/js/t_global_color_status_warning_100';
import { t_global_icon_color_status_danger_default as dangerColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { RunStatus } from '@patternfly/react-topology';
import { runStatus } from '~/consts/pipelinerun';
import type { StatusCategory } from '~/shared/utils/status-registry';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { PIPELINE_RUN_STATUS_REGISTRY } from '~/utils/plr-status-config';
import { DataState, testPipelineRuns } from '../../__data__/pipelinerun-data';

const registry = PIPELINE_RUN_STATUS_REGISTRY;
const registeredStatuses = registry.allStatuses;

// ---------------------------------------------------------------------------
// Parity: deriveStatus vs pipelineRunStatus
// ---------------------------------------------------------------------------

describe('PIPELINE_RUN_STATUS_REGISTRY — parity with pipelineRunStatus', () => {
  it.each([
    ['RUNNING', DataState.RUNNING, 'Running'],
    ['SUCCEEDED', DataState.SUCCEEDED, 'Succeeded'],
    ['FAILED', DataState.FAILED, 'Failed'],
    ['SKIPPED', DataState.SKIPPED, 'Skipped'],
    ['PIPELINE_RUN_PENDING', DataState.PIPELINE_RUN_PENDING, 'Pending'],
    ['PIPELINE_RUN_STOPPED', DataState.PIPELINE_RUN_STOPPED, 'Cancelled'],
    ['PIPELINE_RUN_CANCELLED', DataState.PIPELINE_RUN_CANCELLED, 'Cancelled'],
    ['TASK_RUN_CANCELLED', DataState.TASK_RUN_CANCELLED, 'Cancelled'],
    ['PIPELINE_RUN_CANCELLING', DataState.PIPELINE_RUN_CANCELLING, 'Cancelling'],
    ['PIPELINE_RUN_STOPPING', DataState.PIPELINE_RUN_STOPPING, 'Failed'],
    ['TASK_RUN_STOPPING', DataState.TASK_RUN_STOPPING, 'Failed'],
    ['STATUS_WITHOUT_CONDITIONS', DataState.STATUS_WITHOUT_CONDITIONS, 'Pending'],
    ['STATUS_WITHOUT_CONDITION_TYPE', DataState.STATUS_WITHOUT_CONDITION_TYPE, 'Pending'],
    ['STATUS_WITH_UNKNOWN_REASON', DataState.STATUS_WITH_UNKNOWN_REASON, 'Failed'],
  ])('%s: deriveStatus matches pipelineRunStatus → %s', (_label, dataState, expectedStatus) => {
    const plr = testPipelineRuns[dataState];
    const legacyStatus = pipelineRunStatus(plr);
    const registryStatus = registry.deriveStatus(plr);

    expect(legacyStatus).toBe(expectedStatus);
    expect(registryStatus).toBe(expectedStatus);
  });

  it('matches pipelineRunStatus for ALL test fixtures', () => {
    const queuedDataStates = new Set([
      DataState.PIPELINE_RUN_QUEUED_PAC,
      DataState.PIPELINE_RUN_QUEUED_KUEUE,
    ]);
    for (const [key, plr] of Object.entries(testPipelineRuns)) {
      if (!plr || queuedDataStates.has(key as DataState)) continue;
      const legacy = pipelineRunStatus(plr);
      const derived = registry.deriveStatus(plr);
      expect(derived).toBe(legacy);
    }
  });
});

// ---------------------------------------------------------------------------
// Registry accessors
// ---------------------------------------------------------------------------

describe('PIPELINE_RUN_STATUS_REGISTRY accessors', () => {
  describe('completeness', () => {
    it('has an entry for every registered status', () => {
      for (const s of registeredStatuses) {
        expect(registry.getEntry(s)).toBeDefined();
      }
    });

    it('every entry has a valid category', () => {
      const validCategories: StatusCategory[] = ['success', 'danger', 'warning', 'info', 'neutral'];
      for (const s of registeredStatuses) {
        expect(validCategories).toContain(registry.getCategory(s));
      }
    });

    it('every entry has a numeric weight', () => {
      for (const s of registeredStatuses) {
        expect(typeof registry.getWeight(s)).toBe('number');
      }
    });
  });

  describe('getCategory', () => {
    it.each<[runStatus, StatusCategory]>([
      [runStatus.Succeeded, 'success'],
      [runStatus.Failed, 'danger'],
      [runStatus.Running, 'info'],
      [runStatus.Cancelled, 'warning'],
      [runStatus.Cancelling, 'warning'],
      [runStatus.Skipped, 'neutral'],
      [runStatus.Pending, 'neutral'],
      [runStatus.Unknown, 'neutral'],
    ])('maps %s → %s', (status, expected) => {
      expect(registry.getCategory(status)).toBe(expected);
    });
  });

  describe('getLabel', () => {
    it('returns the enum value as label when no override', () => {
      expect(registry.getLabel(runStatus.Succeeded)).toBe('Succeeded');
      expect(registry.getLabel(runStatus.Failed)).toBe('Failed');
      expect(registry.getLabel(runStatus.Running)).toBe('Running');
    });
  });

  describe('getColor', () => {
    it.each([
      [runStatus.Succeeded, successColor.value],
      [runStatus.Failed, dangerColor.value],
      [runStatus.Running, infoColor.value],
      [runStatus.Cancelled, warningColor.value],
      [runStatus.Cancelling, warningColor.value],
      [runStatus.Skipped, neutralColor.value],
      [runStatus.Pending, neutralColor.value],
      [runStatus.Unknown, neutralColor.value],
    ])('maps %s → %s', (status, expected) => {
      expect(registry.getColor(status)).toBe(expected);
    });
  });

  describe('getColorName', () => {
    it.each([
      [runStatus.Succeeded, 'green'],
      [runStatus.Failed, 'red'],
      [runStatus.Running, 'blue'],
      [runStatus.Cancelled, 'yellow'],
      [runStatus.Pending, 'grey'],
    ])('maps %s → %s', (status, expected) => {
      expect(registry.getColorName(status)).toBe(expected);
    });
  });

  describe('getRunStatus', () => {
    it.each([
      [runStatus.Succeeded, RunStatus.Succeeded],
      [runStatus.Failed, RunStatus.Failed],
      [runStatus.Running, RunStatus.Running],
      [runStatus.Skipped, RunStatus.Skipped],
      [runStatus.Cancelled, RunStatus.Cancelled],
      [runStatus.Cancelling, RunStatus.Cancelled],
      [runStatus.Pending, RunStatus.Pending],
      [runStatus.Unknown, RunStatus.Pending],
    ])('maps %s → %s', (status, expected) => {
      expect(registry.getRunStatus(status)).toBe(expected);
    });

    it('returns a RunStatus for every registered status', () => {
      for (const s of registeredStatuses) {
        expect(registry.getRunStatus(s)).toBeDefined();
      }
    });
  });

  describe('getWeight', () => {
    it('active states have lower weight than terminal states', () => {
      expect(registry.getWeight(runStatus.Running)).toBeLessThan(
        registry.getWeight(runStatus.Succeeded),
      );
      expect(registry.getWeight(runStatus.Pending)).toBeLessThan(
        registry.getWeight(runStatus.Failed),
      );
    });

    it('error states have lower weight than completed states', () => {
      expect(registry.getWeight(runStatus.Failed)).toBeLessThan(
        registry.getWeight(runStatus.Succeeded),
      );
    });
  });

  describe('hasTag', () => {
    it('returns true for in-progress states', () => {
      expect(registry.hasTag(runStatus.Running, 'unfinished')).toBe(true);
      expect(registry.hasTag(runStatus.Pending, 'unfinished')).toBe(true);
      expect(registry.hasTag(runStatus.Cancelling, 'unfinished')).toBe(true);
    });

    it('returns false for terminal states', () => {
      expect(registry.hasTag(runStatus.Succeeded, 'unfinished')).toBe(false);
      expect(registry.hasTag(runStatus.Failed, 'unfinished')).toBe(false);
      expect(registry.hasTag(runStatus.Cancelled, 'unfinished')).toBe(false);
    });
  });

  describe('getStatusesByTag', () => {
    it('includes all unfinished statuses', () => {
      const unfinished = registry.getStatusesByTag('unfinished');
      for (const s of registeredStatuses) {
        if (registry.hasTag(s, 'unfinished')) {
          expect(unfinished).toContain(s);
        }
      }
    });

    it('includes only unfinished statuses', () => {
      for (const s of registry.getStatusesByTag('unfinished')) {
        expect(registry.hasTag(s, 'unfinished')).toBe(true);
      }
    });
  });

  describe('weightMap', () => {
    it('has an entry for every registered status', () => {
      for (const s of registeredStatuses) {
        expect(registry.weightMap[s]).toBeDefined();
        expect(typeof registry.weightMap[s]).toBe('number');
      }
    });

    it('matches getWeight for every value', () => {
      for (const s of registeredStatuses) {
        expect(registry.weightMap[s]).toBe(registry.getWeight(s));
      }
    });
  });

  describe('getStatusConfigs', () => {
    it('returns a config for every registered status', () => {
      const configs = registry.getStatusConfigs();
      expect(configs).toHaveLength(registeredStatuses.length);
      for (const s of registeredStatuses) {
        expect(configs.find((c) => c.status === s)).toBeDefined();
      }
    });

    it('each config has label, color, colorName, and category', () => {
      for (const config of registry.getStatusConfigs()) {
        expect(config.label).toBeTruthy();
        expect(config.color).toBeTruthy();
        expect(config.colorName).toBeTruthy();
        expect(config.category).toBeTruthy();
      }
    });

    it('excludes specified statuses', () => {
      const exclude = new Set([runStatus.Unknown]);
      const configs = registry.getStatusConfigs(exclude);
      expect(configs.find((c) => c.status === runStatus.Unknown)).toBeUndefined();
      expect(configs).toHaveLength(registeredStatuses.length - 1);
    });

    it('configs are sorted by weight', () => {
      const configs = registry.getStatusConfigs();
      for (let i = 1; i < configs.length; i++) {
        const prevWeight = registry.getWeight(configs[i - 1].status);
        const currWeight = registry.getWeight(configs[i].status);
        expect(prevWeight).toBeLessThanOrEqual(currWeight);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Queued status derivation
// ---------------------------------------------------------------------------

describe('PIPELINE_RUN_STATUS_REGISTRY — Queued status', () => {
  it('derives Queued for PLR with PAC queued label and PipelineRunPending spec.status', () => {
    const plr = testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_PAC];
    expect(registry.deriveStatus(plr)).toBe(runStatus.Queued);
  });

  it('derives Queued for PLR with Kueue queue-name label and PipelineRunPending spec.status', () => {
    const plr = testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_KUEUE];
    expect(registry.deriveStatus(plr)).toBe(runStatus.Queued);
  });

  it('derives Pending (not Queued) for PLR with PipelineRunPending but no queue label', () => {
    const plr = testPipelineRuns[DataState.PIPELINE_RUN_PENDING_NO_QUEUE_LABEL];
    expect(registry.deriveStatus(plr)).toBe(runStatus.Pending);
  });
});

// ---------------------------------------------------------------------------
// getReason
// ---------------------------------------------------------------------------

describe('PIPELINE_RUN_STATUS_REGISTRY.getReason', () => {
  it('returns the Succeeded condition message for Failed PLR', () => {
    const plr = testPipelineRuns[DataState.FAILED];
    const message = registry.getReason(plr);
    expect(message).toBe('Error retrieving pipeline for pipelinerun');
  });

  it('returns the Succeeded condition message for Cancelled PLR', () => {
    const plr = testPipelineRuns[DataState.PIPELINE_RUN_CANCELLED];
    const message = registry.getReason(plr);
    expect(message).toBe('PipelineRun "test-casevcgrn" was cancelled');
  });

  it('returns undefined for Running PLR (no reason fn)', () => {
    const plr = testPipelineRuns[DataState.RUNNING];
    expect(registry.getReason(plr)).toBeUndefined();
  });

  it('returns undefined for Succeeded PLR (no reason fn)', () => {
    const plr = testPipelineRuns[DataState.SUCCEEDED];
    expect(registry.getReason(plr)).toBeUndefined();
  });

  it('returns undefined for Queued PLR (no reason fn)', () => {
    const plr = testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_PAC];
    expect(registry.getReason(plr)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// createFilterFn
// ---------------------------------------------------------------------------

describe('PIPELINE_RUN_STATUS_REGISTRY.createFilterFn', () => {
  it('filters by derived status', () => {
    const runningPLR = testPipelineRuns[DataState.RUNNING];
    const succeededPLR = testPipelineRuns[DataState.SUCCEEDED];
    const failedPLR = testPipelineRuns[DataState.FAILED];

    const filterFn = registry.createFilterFn([runStatus.Running, runStatus.Failed]);

    expect(filterFn(runningPLR)).toBe(true);
    expect(filterFn(failedPLR)).toBe(true);
    expect(filterFn(succeededPLR)).toBe(false);
  });

  it('Skipped PLR is not a false positive when filtering Succeeded', () => {
    const skippedPLR = testPipelineRuns[DataState.SKIPPED];
    const filterSucceeded = registry.createFilterFn([runStatus.Succeeded]);
    const filterSkipped = registry.createFilterFn([runStatus.Skipped]);

    expect(filterSucceeded(skippedPLR)).toBe(false);
    expect(filterSkipped(skippedPLR)).toBe(true);
  });
});

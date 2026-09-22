/**
 * PipelineRun status registry and pre-bound React namespace.
 *
 * Adding a new status (e.g. `Queued`):
 * 1. Add the value to `runStatus` enum in `~/consts/pipelinerun`.
 * 2. Add ONE entry to the `statuses` array below.
 */

import { RunStatus } from '@patternfly/react-topology';
import { runStatus, SucceedConditionReason } from '~/consts/pipelinerun';
import { createStatusComponents } from '~/shared/components/StatusRegistry/StatusRegistryComponents';
import {
  createStatusRegistry,
  type StatusCategory,
  type StatusRegistry,
} from '~/shared/utils/status-registry';
import { Condition, PipelineRunKind } from '~/types';

export type { StatusCategory, StatusRegistry };

type PLRContext = {
  conditions: Condition[] | undefined;
  succeededCond: Condition | undefined;
  cancelledCond: Condition | undefined;
  stoppingCond: Condition | undefined;
  specStatus: string | undefined;
  succeededStatus: 'Succeeded' | 'Failed' | 'Running' | 'None';
};

const CANCEL_REASONS: ReadonlySet<string> = new Set([
  SucceedConditionReason.PipelineRunStopped,
  SucceedConditionReason.PipelineRunCancelled,
  SucceedConditionReason.TaskRunCancelled,
  SucceedConditionReason.Cancelled,
]);

const STOPPING_REASONS: ReadonlySet<string> = new Set([
  SucceedConditionReason.PipelineRunStopping,
  SucceedConditionReason.TaskRunStopping,
]);

const PENDING_REASONS: ReadonlySet<string> = new Set([
  SucceedConditionReason.CreateContainerConfigError,
  SucceedConditionReason.ExceededNodeResources,
  SucceedConditionReason.ExceededResourceQuota,
  SucceedConditionReason.PipelineRunPending,
]);

const createPLRContext = (plr: PipelineRunKind): PLRContext => {
  const conditions = plr.status?.conditions;
  const succeededCond = conditions?.find((c) => c.type === 'Succeeded');
  return {
    conditions,
    succeededCond,
    cancelledCond: conditions?.find((c) => c.reason === 'Cancelled'),
    stoppingCond: conditions?.find((c) => c.reason === 'StoppedRunningFinally'),
    specStatus: plr.spec?.status,
    succeededStatus: !succeededCond?.status
      ? 'None'
      : succeededCond.status === 'True'
        ? 'Succeeded'
        : succeededCond.status === 'False'
          ? 'Failed'
          : 'Running',
  };
};

/**
 * Array position = predicate evaluation order (first match wins).
 * Weight = display/sort order (lower = more prominent).
 *
 * Evaluation order replicates conditionsRunStatus() from pipeline-utils.ts.
 */
export const PIPELINE_RUN_STATUS_REGISTRY = createStatusRegistry<
  runStatus,
  PipelineRunKind,
  PLRContext
>()({
  createContext: createPLRContext,
  statuses: [
    {
      status: runStatus.Cancelling,
      match: (_plr, ctx) =>
        (ctx.specStatus === SucceedConditionReason.PipelineRunCancelled && !ctx.cancelledCond) ||
        (ctx.specStatus === SucceedConditionReason.PipelineRunStopped && !!ctx.stoppingCond),
      category: 'warning',
      weight: 15,
      tags: ['unfinished'],
      reason: (_plr, ctx) => ctx.succeededCond?.message,
    },
    {
      status: runStatus.Queued,
      match: (plr, ctx) =>
        ctx.specStatus === SucceedConditionReason.PipelineRunPending &&
        (plr.metadata?.labels?.['pipelinesascode.tekton.dev/state'] === 'queued' ||
          plr.metadata?.labels?.['kueue.x-k8s.io/queue-name'] !== undefined),
      category: 'neutral',
      weight: 18,
      tags: ['unfinished'],
    },
    {
      status: runStatus.Pending,
      match: (_plr, ctx) =>
        ctx.succeededStatus === 'None' || PENDING_REASONS.has(ctx.succeededCond?.reason ?? ''),
      category: 'neutral',
      weight: 20,
      tags: ['unfinished'],
      reason: (_plr, ctx) => ctx.succeededCond?.message,
    },
    {
      status: runStatus.Cancelled,
      match: (_plr, ctx) => CANCEL_REASONS.has(ctx.succeededCond?.reason ?? ''),
      category: 'warning',
      weight: 60,
      tags: ['terminal'],
      reason: (_plr, ctx) => ctx.succeededCond?.message,
    },
    {
      status: runStatus.Skipped,
      match: (_plr, ctx) =>
        ctx.succeededCond?.reason === SucceedConditionReason.ConditionCheckFailed,
      category: 'neutral',
      weight: 66,
      pfRunStatus: RunStatus.Skipped,
      tags: ['terminal'],
      reason: (_plr, ctx) => ctx.succeededCond?.message,
    },
    {
      status: runStatus.Running,
      match: (_plr, ctx) => {
        if (ctx.succeededStatus !== 'Running') return false;
        const reason = ctx.succeededCond?.reason ?? '';
        if (STOPPING_REASONS.has(reason)) return false;
        return true;
      },
      category: 'info',
      weight: 10,
      tags: ['unfinished', 'active'],
    },
    {
      status: runStatus.Failed,
      match: (_plr, ctx) => {
        if (ctx.succeededStatus === 'Failed') return true;
        if (
          ctx.succeededStatus === 'Running' &&
          STOPPING_REASONS.has(ctx.succeededCond?.reason ?? '')
        ) {
          return true;
        }
        return false;
      },
      category: 'danger',
      weight: 41,
      tags: ['terminal', 'error'],
      reason: (_plr, ctx) => ctx.succeededCond?.message,
    },
    {
      status: runStatus.Succeeded,
      match: (_plr, ctx) => ctx.succeededStatus === 'Succeeded',
      category: 'success',
      weight: 65,
      tags: ['terminal'],
    },
    {
      status: runStatus.Unknown,
      match: () => true,
      category: 'neutral',
      weight: 90,
    },
  ],
});

export type PLRStatusRegistry = typeof PIPELINE_RUN_STATUS_REGISTRY;

export const PLRStatus = createStatusComponents(PIPELINE_RUN_STATUS_REGISTRY);

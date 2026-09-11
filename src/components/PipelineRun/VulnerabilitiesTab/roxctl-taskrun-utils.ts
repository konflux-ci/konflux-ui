import { ROXCTL_SCAN_TASK } from '~/consts/security';
import type { TaskRunKind } from '~/types';
import { TektonResourceLabel } from '~/types';

export const findRoxctlScanTaskRun = (taskRuns: TaskRunKind[]): TaskRunKind | undefined =>
  taskRuns.find(
    (taskRun) => taskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask] === ROXCTL_SCAN_TASK,
  );

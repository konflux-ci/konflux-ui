import { ROXCTL_SCAN_TASK } from '~/consts/security';
import type { TaskRunKind } from '~/types';
import { TektonResourceLabel } from '~/types';
import { findRoxctlScanTaskRun } from '../roxctl-taskrun-utils';

const createTaskRun = (pipelineTask: string, name: string): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name,
      labels: {
        [TektonResourceLabel.pipelineTask]: pipelineTask,
      },
    },
  }) as unknown as TaskRunKind;

describe('findRoxctlScanTaskRun', () => {
  it.each([
    {
      description: 'returns the roxctl-scan task run when present',
      taskRuns: [
        createTaskRun('build-container', 'build-container-run'),
        createTaskRun(ROXCTL_SCAN_TASK, 'roxctl-scan-run'),
      ],
      expectedName: 'roxctl-scan-run',
    },
    {
      description: 'returns undefined when roxctl-scan is absent',
      taskRuns: [createTaskRun('clair-scan', 'clair-scan-run')],
      expectedName: undefined,
    },
    {
      description: 'returns undefined for an empty list',
      taskRuns: [],
      expectedName: undefined,
    },
  ])('$description', ({ taskRuns, expectedName }) => {
    const result = findRoxctlScanTaskRun(taskRuns);

    if (expectedName) {
      expect(result?.metadata.name).toBe(expectedName);
    } else {
      expect(result).toBeUndefined();
    }
  });
});

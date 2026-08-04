import { filterInvalidImageConformaRows, resolveConformaResultFromTaskRun } from '~/components/Conforma/ConformaResultsTab/conforma-fetchers';
import { EC_TASK, CONFORMA_TASK } from '~/consts/security';
import { k8sListResource } from '~/k8s';
import type { PipelineRunKind, TaskRunKind } from '~/types';
import { type ComponentConformaResult } from '~/types/conforma';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun, sortTaskRunsByTime } from '~/utils/pipeline-utils';
import {
  aggregateCounts,
  fetchConformaForPipeline,
  securityTaskForPipeline,
} from '../conforma-fetch-utils';

jest.mock('~/k8s', () => ({
  k8sListResource: jest.fn(),
}));

jest.mock('~/utils/conforma-utils', () => ({
  isResourceEnterpriseContract: jest.fn(),
}));

jest.mock('~/utils/pipeline-utils', () => ({
  isTaskRunInPipelineRun: jest.fn(),
  sortTaskRunsByTime: jest.fn((trs: TaskRunKind[]) => [...trs]),
}));

jest.mock('../ConformaResultsTab/conforma-fetchers', () => ({
  resolveConformaResultFromTaskRun: jest.fn(),
  filterInvalidImageConformaRows: jest.fn((rows: ComponentConformaResult[]) => rows),
}));

const mockIsEC = isResourceEnterpriseContract as jest.Mock;
const mockIsTaskInPR = isTaskRunInPipelineRun as jest.Mock;
const mockSortTaskRuns = sortTaskRunsByTime as jest.Mock;
const mockK8sListResource = k8sListResource as jest.Mock;
const mockResolveConforma = resolveConformaResultFromTaskRun as jest.Mock;
const mockFilterInvalid = filterInvalidImageConformaRows as jest.Mock;

const fakePR = { metadata: { name: 'pr-1' } } as unknown as PipelineRunKind;

const createTaskRun = (name: string): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: { name, namespace: 'test-ns', uid: `uid-${name}` },
    status: {},
  }) as unknown as TaskRunKind;

const mockComponents: ComponentConformaResult[] = [
  {
    containerImage: 'quay.io/test/img',
    name: 'comp-a',
    success: false,
    violations: [{ metadata: { title: 'v1', description: '', collections: [], code: 'c1' }, msg: 'v1' }],
    warnings: [
      { metadata: { title: 'w1', description: '', collections: [], code: 'w1' }, msg: 'w1' },
      { metadata: { title: 'w2', description: '', collections: [], code: 'w2' }, msg: 'w2' },
    ],
    successes: [{ metadata: { title: 's1', description: '', collections: [], code: 's1' }, msg: 's1' }],
  },
];

describe('securityTaskForPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns EC_TASK when the pipeline run is an Enterprise Contract run', () => {
    mockIsEC.mockReturnValue(true);
    expect(securityTaskForPipeline(fakePR)).toBe(EC_TASK);
  });

  it('returns CONFORMA_TASK when the pipeline run contains a Conforma task', () => {
    mockIsEC.mockReturnValue(false);
    mockIsTaskInPR.mockReturnValue(true);
    expect(securityTaskForPipeline(fakePR)).toBe(CONFORMA_TASK);
  });

  it('returns undefined when the pipeline run has neither EC nor Conforma task', () => {
    mockIsEC.mockReturnValue(false);
    mockIsTaskInPR.mockReturnValue(false);
    expect(securityTaskForPipeline(fakePR)).toBeUndefined();
  });

  it('does not call isTaskRunInPipelineRun when isResourceEnterpriseContract returns true', () => {
    mockIsEC.mockReturnValue(true);
    securityTaskForPipeline(fakePR);
    expect(mockIsTaskInPR).not.toHaveBeenCalled();
  });
});

describe('aggregateCounts', () => {
  it('sums violations, warnings and successes across components', () => {
    const result = aggregateCounts(mockComponents);
    expect(result).toEqual({ violationCount: 1, warningCount: 2, successCount: 1 });
  });

  it('treats missing violation/warning/success arrays as zero', () => {
    const bare: ComponentConformaResult[] = [
      { containerImage: 'img', name: 'c', success: true },
    ];
    expect(aggregateCounts(bare)).toEqual({ violationCount: 0, warningCount: 0, successCount: 0 });
  });

  it('returns all zeros for an empty component list', () => {
    expect(aggregateCounts([])).toEqual({ violationCount: 0, warningCount: 0, successCount: 0 });
  });

  it('accumulates counts across multiple components', () => {
    const two: ComponentConformaResult[] = [
      { containerImage: 'img1', name: 'a', success: false,
        violations: [{ metadata: { title: '', description: '', collections: [], code: '' }, msg: '' }] },
      { containerImage: 'img2', name: 'b', success: false,
        violations: [
          { metadata: { title: '', description: '', collections: [], code: '' }, msg: '' },
          { metadata: { title: '', description: '', collections: [], code: '' }, msg: '' },
        ] },
    ];
    expect(aggregateCounts(two).violationCount).toBe(3);
  });
});

describe('fetchConformaForPipeline', () => {
  const NS = 'test-ns';
  const PR_NAME = 'pr-1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFilterInvalid.mockImplementation((rows: ComponentConformaResult[]) => rows);
  });

  it('returns an empty array when no TaskRuns are found', async () => {
    mockK8sListResource.mockResolvedValue({ items: [] });
    mockSortTaskRuns.mockReturnValue([]);

    const result = await fetchConformaForPipeline(NS, PR_NAME, CONFORMA_TASK, false);

    expect(result).toEqual([]);
    expect(mockResolveConforma).not.toHaveBeenCalled();
  });

  it('resolves and filters conforma results from the first TaskRun', async () => {
    const taskRun = createTaskRun('tr-1');
    mockK8sListResource.mockResolvedValue({ items: [taskRun] });
    mockSortTaskRuns.mockReturnValue([taskRun]);
    mockResolveConforma.mockResolvedValue({ components: mockComponents });
    mockFilterInvalid.mockReturnValue(mockComponents);

    const result = await fetchConformaForPipeline(NS, PR_NAME, EC_TASK, false);

    expect(mockResolveConforma).toHaveBeenCalledWith(NS, taskRun, false);
    expect(result).toBe(mockComponents);
  });

  it('passes isKubearchiveLogsEnabled to resolveConformaResultFromTaskRun', async () => {
    const taskRun = createTaskRun('tr-1');
    mockK8sListResource.mockResolvedValue({ items: [taskRun] });
    mockSortTaskRuns.mockReturnValue([taskRun]);
    mockResolveConforma.mockResolvedValue({ components: [] });

    await fetchConformaForPipeline(NS, PR_NAME, EC_TASK, true);

    expect(mockResolveConforma).toHaveBeenCalledWith(NS, taskRun, true);
  });

  it('returns empty array when resolveConformaResultFromTaskRun returns undefined', async () => {
    const taskRun = createTaskRun('tr-1');
    mockK8sListResource.mockResolvedValue({ items: [taskRun] });
    mockSortTaskRuns.mockReturnValue([taskRun]);
    mockResolveConforma.mockResolvedValue(undefined);
    mockFilterInvalid.mockReturnValue([]);

    const result = await fetchConformaForPipeline(NS, PR_NAME, CONFORMA_TASK, false);

    expect(result).toEqual([]);
  });

  it('propagates errors thrown by k8sListResource', async () => {
    mockK8sListResource.mockRejectedValue(new Error('k8s unavailable'));

    await expect(fetchConformaForPipeline(NS, PR_NAME, CONFORMA_TASK, false)).rejects.toThrow(
      'k8s unavailable',
    );
  });

  it('propagates errors thrown by resolveConformaResultFromTaskRun', async () => {
    const taskRun = createTaskRun('tr-1');
    mockK8sListResource.mockResolvedValue({ items: [taskRun] });
    mockSortTaskRuns.mockReturnValue([taskRun]);
    mockResolveConforma.mockRejectedValue(new Error('log fetch failed'));

    await expect(fetchConformaForPipeline(NS, PR_NAME, EC_TASK, false)).rejects.toThrow(
      'log fetch failed',
    );
  });
});

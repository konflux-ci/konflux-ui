import { filterInvalidImageConformaRows, resolveConformaResultFromTaskRun } from '~/components/Conforma/ConformaResultsTab/conforma-fetchers';
import { k8sListResource } from '~/k8s';
import type { TaskRunKind } from '~/types';
import { type ComponentConformaResult } from '~/types/conforma';
import { sortTaskRunsByTime } from '~/utils/pipeline-utils';
import {
  aggregateCounts,
  fetchConformaForComponent,
} from '../conforma-fetch-utils';

jest.mock('~/k8s', () => ({
  k8sListResource: jest.fn(),
}));

jest.mock('~/utils/pipeline-utils', () => ({
  sortTaskRunsByTime: jest.fn((trs: TaskRunKind[]) => [...trs]),
}));

jest.mock('../ConformaResultsTab/conforma-fetchers', () => ({
  resolveConformaResultFromTaskRun: jest.fn(),
  filterInvalidImageConformaRows: jest.fn((rows: ComponentConformaResult[]) => rows),
}));

const mockSortTaskRuns = sortTaskRunsByTime as jest.Mock;
const mockK8sListResource = k8sListResource as jest.Mock;
const mockResolveConforma = resolveConformaResultFromTaskRun as jest.Mock;
const mockFilterInvalid = filterInvalidImageConformaRows as jest.Mock;

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

describe('fetchConformaForComponent', () => {
  const NS = 'test-ns';
  const COMP_NAME = 'comp-a';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFilterInvalid.mockImplementation((rows: ComponentConformaResult[]) => rows);
  });

  it('returns empty array when no TaskRuns exist for either EC or Conforma task', async () => {
    mockK8sListResource.mockResolvedValue({ items: [] });
    mockSortTaskRuns.mockReturnValue([]);

    const result = await fetchConformaForComponent(NS, COMP_NAME, false);

    expect(result).toEqual([]);
    expect(mockResolveConforma).not.toHaveBeenCalled();
    expect(mockK8sListResource).toHaveBeenCalledTimes(2);
  });

  it('uses EC TaskRun when available (EC takes priority)', async () => {
    const taskRun = createTaskRun('tr-ec');
    mockK8sListResource.mockResolvedValue({ items: [taskRun] });
    mockSortTaskRuns.mockReturnValue([taskRun]);
    mockResolveConforma.mockResolvedValue({ components: mockComponents });
    mockFilterInvalid.mockReturnValue(mockComponents);

    const result = await fetchConformaForComponent(NS, COMP_NAME, false);

    expect(mockResolveConforma).toHaveBeenCalledWith(NS, taskRun, false);
    expect(result).toBe(mockComponents);
    expect(mockK8sListResource).toHaveBeenCalledTimes(1);
  });

  it('falls back to CONFORMA_TASK when no EC TaskRuns exist', async () => {
    const taskRun = createTaskRun('tr-conforma');
    mockK8sListResource
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [taskRun] });
    mockSortTaskRuns
      .mockReturnValueOnce([])
      .mockReturnValueOnce([taskRun]);
    mockResolveConforma.mockResolvedValue({ components: mockComponents });
    mockFilterInvalid.mockReturnValue(mockComponents);

    const result = await fetchConformaForComponent(NS, COMP_NAME, false);

    expect(mockResolveConforma).toHaveBeenCalledWith(NS, taskRun, false);
    expect(result).toBe(mockComponents);
    expect(mockK8sListResource).toHaveBeenCalledTimes(2);
  });

  it('passes isKubearchiveLogsEnabled to resolveConformaResultFromTaskRun', async () => {
    const taskRun = createTaskRun('tr-1');
    mockK8sListResource.mockResolvedValue({ items: [taskRun] });
    mockSortTaskRuns.mockReturnValue([taskRun]);
    mockResolveConforma.mockResolvedValue({ components: [] });

    await fetchConformaForComponent(NS, COMP_NAME, true);

    expect(mockResolveConforma).toHaveBeenCalledWith(NS, taskRun, true);
  });

  it('returns empty array when resolveConformaResultFromTaskRun returns undefined', async () => {
    const taskRun = createTaskRun('tr-1');
    mockK8sListResource.mockResolvedValue({ items: [taskRun] });
    mockSortTaskRuns.mockReturnValue([taskRun]);
    mockResolveConforma.mockResolvedValue(undefined);
    mockFilterInvalid.mockReturnValue([]);

    const result = await fetchConformaForComponent(NS, COMP_NAME, false);

    expect(result).toEqual([]);
  });

  it('propagates errors thrown by k8sListResource', async () => {
    mockK8sListResource.mockRejectedValue(new Error('k8s unavailable'));

    await expect(fetchConformaForComponent(NS, COMP_NAME, false)).rejects.toThrow(
      'k8s unavailable',
    );
  });
});

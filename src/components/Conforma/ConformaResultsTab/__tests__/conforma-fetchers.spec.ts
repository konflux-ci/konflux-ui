import { extractConformaResultsFromTaskRunLogs } from '~/components/Conforma/utils';
import { commonFetchJSON, getK8sResourceURL } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { PodModel } from '~/models/pod';
import type { TaskRunKind } from '~/types';
import {
  CONFORMA_RESULT_STATUS,
  type ComponentConformaResult,
  type ConformaResult,
} from '~/types/conforma';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import {
  fetchConformaLogFromKubearchive,
  fetchConformaLogFromTektonResults,
  filterInvalidImageConformaRows,
  mapConformaResultData,
  resolveConformaResultFromTaskRun,
} from '../conforma-fetchers';
import '@testing-library/jest-dom';

jest.mock('~/k8s', () => ({
  commonFetchJSON: jest.fn(),
  getK8sResourceURL: jest.fn(() => '/fake-url'),
}));
jest.mock('~/utils/tekton-results', () => ({ getTaskRunLog: jest.fn() }));
jest.mock('~/components/Conforma/utils', () => ({
  extractConformaResultsFromTaskRunLogs: jest.fn(),
}));
jest.mock('~/utils/common-utils', () => ({
  getPipelineRunFromTaskRunOwnerRef: jest.fn(),
}));

const createTaskRun = (name: string, podName?: string): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name,
      namespace: 'test-ns',
      uid: `uid-${name}`,
      ownerReferences: [{ kind: 'PipelineRun', uid: 'pr-uid-1' }],
    },
    status: podName ? { podName } : {},
  }) as unknown as TaskRunKind;

const mockConformaResult: ConformaResult = {
  components: [
    {
      containerImage: 'quay.io/test/image@sha256:abc',
      name: 'comp-a',
      success: false,
      violations: [
        {
          metadata: {
            title: 'Missing CVE scan',
            description: 'No CVE scan found',
            collections: ['slsa3'],
            code: 'cve_scan.missing',
          },
          msg: 'CVE scan is missing',
        },
      ],
      warnings: [],
      successes: [],
    },
  ],
};

const NAMESPACE = 'test-ns';

describe('fetchConformaLogFromKubearchive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getK8sResourceURL).mockReturnValue('/fake-url');
  });

  it('fetches pod log via kubearchive pathPrefix', async () => {
    jest.mocked(commonFetchJSON).mockResolvedValue(mockConformaResult);

    const result = await fetchConformaLogFromKubearchive(NAMESPACE, createTaskRun('tr-1', 'pod-1'));

    expect(getK8sResourceURL).toHaveBeenCalledWith(
      PodModel,
      undefined,
      expect.objectContaining({
        ns: NAMESPACE,
        name: 'pod-1',
        path: 'log',
        queryParams: { container: 'step-report-json' },
      }),
    );
    expect(commonFetchJSON).toHaveBeenCalledWith('/fake-url', {
      pathPrefix: KUBEARCHIVE_PATH_PREFIX,
    });
    expect(result).toEqual(mockConformaResult);
  });

  it('throws when TaskRun has no podName', async () => {
    await expect(fetchConformaLogFromKubearchive(NAMESPACE, createTaskRun('tr-1'))).rejects.toThrow(
      'TaskRun has no podName',
    );

    expect(commonFetchJSON).not.toHaveBeenCalled();
  });

  it('throws when the fetch fails', async () => {
    jest.mocked(commonFetchJSON).mockRejectedValue(new Error('kubearchive down'));

    await expect(
      fetchConformaLogFromKubearchive(NAMESPACE, createTaskRun('tr-1', 'pod-1')),
    ).rejects.toThrow('kubearchive down');
  });
});

describe('fetchConformaLogFromTektonResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue({ uid: 'pr-uid-1' } as never);
  });

  it('fetches and parses logs via tekton-results', async () => {
    jest.mocked(getTaskRunLog).mockResolvedValue('tekton-logs');
    jest.mocked(extractConformaResultsFromTaskRunLogs).mockReturnValue(mockConformaResult);

    const result = await fetchConformaLogFromTektonResults(
      NAMESPACE,
      createTaskRun('tr-1', 'pod-1'),
    );

    expect(getTaskRunLog).toHaveBeenCalledWith('test-ns', 'uid-tr-1', 'pr-uid-1');
    expect(extractConformaResultsFromTaskRunLogs).toHaveBeenCalledWith('tekton-logs');
    expect(result).toEqual(mockConformaResult);
  });

  it('throws when TaskRun is missing uid', async () => {
    const bareboneTaskRun = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      metadata: { name: 'tr-bare', namespace: 'test-ns' },
      status: {},
    } as unknown as TaskRunKind;
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue(undefined);

    await expect(fetchConformaLogFromTektonResults(NAMESPACE, bareboneTaskRun)).rejects.toThrow(
      'TaskRun missing uid/namespace or PipelineRun ownerRef',
    );

    expect(getTaskRunLog).not.toHaveBeenCalled();
  });

  it('throws when PipelineRun ownerRef is missing', async () => {
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue(undefined);

    await expect(
      fetchConformaLogFromTektonResults(NAMESPACE, createTaskRun('tr-1', 'pod-1')),
    ).rejects.toThrow('TaskRun missing uid/namespace or PipelineRun ownerRef');
  });

  it('throws when getTaskRunLog fails', async () => {
    jest.mocked(getTaskRunLog).mockRejectedValue(new Error('tekton-results down'));

    await expect(
      fetchConformaLogFromTektonResults(NAMESPACE, createTaskRun('tr-1', 'pod-1')),
    ).rejects.toThrow('tekton-results down');
  });
});

describe('resolveConformaResultFromTaskRun', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(commonFetchJSON).mockResolvedValue(mockConformaResult);
    jest.mocked(getK8sResourceURL).mockReturnValue('/fake-url');
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue({ uid: 'pr-uid-1' } as never);
    jest.mocked(getTaskRunLog).mockResolvedValue('tekton-logs');
    jest.mocked(extractConformaResultsFromTaskRunLogs).mockReturnValue(mockConformaResult);
  });

  it('delegates to kubearchive when flag is ON', async () => {
    const result = await resolveConformaResultFromTaskRun(
      NAMESPACE,
      createTaskRun('tr-1', 'pod-1'),
      true,
    );

    expect(commonFetchJSON).toHaveBeenCalledWith('/fake-url', {
      pathPrefix: KUBEARCHIVE_PATH_PREFIX,
    });
    expect(getTaskRunLog).not.toHaveBeenCalled();
    expect(result).toEqual(mockConformaResult);
  });

  it('throws when flag is ON and kubearchive fails — tekton-results is never called', async () => {
    jest.mocked(commonFetchJSON).mockRejectedValue(new Error('kubearchive down'));

    await expect(
      resolveConformaResultFromTaskRun(NAMESPACE, createTaskRun('tr-1', 'pod-1'), true),
    ).rejects.toThrow('kubearchive down');

    expect(getTaskRunLog).not.toHaveBeenCalled();
  });

  it('delegates to tekton-results when flag is OFF', async () => {
    const result = await resolveConformaResultFromTaskRun(
      NAMESPACE,
      createTaskRun('tr-1', 'pod-1'),
      false,
    );

    expect(getTaskRunLog).toHaveBeenCalledWith('test-ns', 'uid-tr-1', 'pr-uid-1');
    expect(commonFetchJSON).not.toHaveBeenCalled();
    expect(result).toEqual(mockConformaResult);
  });

  it('throws when flag is OFF and tekton-results fails — kubearchive is never called', async () => {
    jest.mocked(getTaskRunLog).mockRejectedValue(new Error('tekton-results down'));

    await expect(
      resolveConformaResultFromTaskRun(NAMESPACE, createTaskRun('tr-1', 'pod-1'), false),
    ).rejects.toThrow('tekton-results down');

    expect(commonFetchJSON).not.toHaveBeenCalled();
  });
});

describe('mapConformaResultData', () => {
  const baseComponent: ComponentConformaResult = {
    containerImage: 'quay.io/test/image@sha256:abc',
    name: 'comp-a',
    success: false,
    violations: [
      {
        metadata: {
          title: 'Missing CVE scan',
          description: 'No CVE scan found',
          collections: ['slsa3'],
          code: 'cve_scan.missing',
        },
        msg: 'CVE scan is missing',
      },
    ],
    warnings: [
      {
        metadata: {
          title: 'Deprecated API',
          description: 'Uses deprecated API',
          collections: ['slsa2'],
          code: 'api.deprecated',
        },
        msg: 'Deprecated',
      },
    ],
    successes: [
      {
        metadata: {
          title: 'Base image allowed',
          description: 'Base image is in the allow list',
          collections: ['slsa1'],
          code: 'base_image.allowed',
        },
        msg: 'Passed',
      },
    ],
  };

  it('threads code from violations through to UIConformaData', () => {
    const result = mapConformaResultData([baseComponent]);
    const violation = result.find((r) => r.status === CONFORMA_RESULT_STATUS.violations);
    expect(violation?.code).toBe('cve_scan.missing');
    expect(violation?.title).toBe('Missing CVE scan');
  });

  it('threads code from warnings through to UIConformaData', () => {
    const result = mapConformaResultData([baseComponent]);
    const warning = result.find((r) => r.status === CONFORMA_RESULT_STATUS.warnings);
    expect(warning?.code).toBe('api.deprecated');
  });

  it('threads code from successes through to UIConformaData', () => {
    const result = mapConformaResultData([baseComponent]);
    const success = result.find((r) => r.status === CONFORMA_RESULT_STATUS.successes);
    expect(success?.code).toBe('base_image.allowed');
  });

  it('produces undefined code when rule metadata is absent', () => {
    const componentWithoutCode: ComponentConformaResult = {
      containerImage: 'quay.io/test/image',
      name: 'comp-b',
      success: false,
      violations: [{ msg: 'error: 404 Not Found' } as never],
    };
    const result = mapConformaResultData([componentWithoutCode]);
    expect(result[0].code).toBeUndefined();
  });

  it('sets pipelineRunName on every mapped row when passed as second arg', () => {
    const result = mapConformaResultData([baseComponent], 'pr-1');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.pipelineRunName === 'pr-1')).toBe(true);
  });

  it('leaves pipelineRunName undefined when not passed', () => {
    const result = mapConformaResultData([baseComponent]);
    expect(result.every((r) => r.pipelineRunName === undefined)).toBe(true);
  });
});

describe('filterInvalidImageConformaRows', () => {
  it('removes violations with 404 Not Found msg and no metadata', () => {
    const input: ComponentConformaResult[] = [
      {
        containerImage: 'quay.io/test/image',
        name: 'comp-a',
        success: false,
        violations: [
          { msg: 'error: 404 Not Found' } as never,
          {
            metadata: {
              title: 'Real violation',
              description: 'This is real',
              collections: [],
              code: 'real.issue',
            },
            msg: 'Real violation message',
          },
        ],
      },
    ];

    const result = filterInvalidImageConformaRows(input);

    expect(result[0].violations).toHaveLength(1);
    expect(result[0].violations?.[0].msg).toBe('Real violation message');
  });

  it('keeps violations with metadata even when msg mentions 404', () => {
    const input: ComponentConformaResult[] = [
      {
        containerImage: 'quay.io/test/image',
        name: 'comp-a',
        success: false,
        violations: [
          {
            metadata: {
              title: 'Artifact not found',
              description: 'The artifact returned 404',
              collections: [],
              code: 'artifact.404',
            },
            msg: 'error: 404 Not Found',
          },
        ],
      },
    ];

    const result = filterInvalidImageConformaRows(input);

    expect(result[0].violations).toHaveLength(1);
    expect(result[0].violations?.[0].metadata?.title).toBe('Artifact not found');
  });

  it('handles components with violations: undefined', () => {
    const input: ComponentConformaResult[] = [
      {
        containerImage: 'quay.io/test/image',
        name: 'comp-a',
        success: true,
      },
    ];

    const result = filterInvalidImageConformaRows(input);

    expect(result).toEqual(input);
  });

  it('handles empty array', () => {
    expect(filterInvalidImageConformaRows([])).toEqual([]);
  });

  it('preserves other fields while filtering violations', () => {
    const input: ComponentConformaResult[] = [
      {
        containerImage: 'quay.io/test/image',
        name: 'comp-a',
        success: false,
        violations: [{ msg: 'error: 404 Not Found' } as never],
        warnings: [
          {
            metadata: {
              title: 'A warning',
              description: 'desc',
              collections: [],
              code: 'w1',
            },
            msg: 'warn msg',
          },
        ],
        successes: [
          {
            metadata: {
              title: 'A success',
              description: 'desc',
              collections: [],
              code: 's1',
            },
            msg: 'success msg',
          },
        ],
      },
    ];

    const result = filterInvalidImageConformaRows(input);

    expect(result[0].violations).toHaveLength(0);
    expect(result[0].warnings).toHaveLength(1);
    expect(result[0].successes).toHaveLength(1);
    expect(result[0].containerImage).toBe('quay.io/test/image');
  });
});

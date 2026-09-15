import {
  extractCveReportFromRawLog,
  extractCveReportFromTaskRunLogs,
} from '~/components/PipelineRun/VulnerabilitiesTab/roxctl-utils';
import { commonFetchText, getK8sResourceURL } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import { PodModel } from '~/models/pod';
import type { TaskRunKind } from '~/types';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import {
  fetchCveReportFromKubearchive,
  fetchCveReportFromTektonResults,
  resolveRoxctlCveReport,
} from '../roxctl-fetchers';
import type { RoxctlFlatCveEntry } from '../types';

jest.mock('~/k8s', () => ({
  commonFetchText: jest.fn(),
  getK8sResourceURL: jest.fn(() => '/fake-url'),
}));
jest.mock('~/utils/tekton-results', () => ({ getTaskRunLog: jest.fn() }));
jest.mock('~/components/PipelineRun/VulnerabilitiesTab/roxctl-utils', () => {
  const actual = jest.requireActual('~/components/PipelineRun/VulnerabilitiesTab/roxctl-utils');
  return {
    ...actual,
    extractCveReportFromTaskRunLogs: jest.fn(),
    extractCveReportFromRawLog: jest.fn(),
  };
});
jest.mock('~/utils/common-utils', () => ({
  getPipelineRunFromTaskRunOwnerRef: jest.fn(),
}));

const NAMESPACE = 'test-ns';

const mockFlatEntries: RoxctlFlatCveEntry[] = [
  {
    cve: 'CVE-2024-0001',
    severity: 'CRITICAL_VULNERABILITY_SEVERITY',
    components: [{ component: 'openssl', version: '1.1.1k' }],
  },
];

const createTaskRun = (name: string, podName?: string): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name,
      namespace: NAMESPACE,
      uid: `uid-${name}`,
      ownerReferences: [{ kind: 'PipelineRun', uid: 'pr-uid-1' }],
    },
    status: podName ? { podName } : {},
  }) as unknown as TaskRunKind;

describe('fetchCveReportFromKubearchive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getK8sResourceURL).mockReturnValue('/fake-url');
  });

  it('fetches pod log as text via kubearchive pathPrefix and parses it', async () => {
    jest.mocked(commonFetchText).mockImplementation((_url, options) => {
      if (options?.pathPrefix === KUBEARCHIVE_PATH_PREFIX) {
        return Promise.resolve('raw-log-text');
      }
      return Promise.resolve('');
    });
    jest.mocked(extractCveReportFromRawLog).mockReturnValue([mockFlatEntries]);

    const result = await fetchCveReportFromKubearchive(NAMESPACE, createTaskRun('tr-1', 'pod-1'));

    expect(getK8sResourceURL).toHaveBeenCalledWith(
      PodModel,
      undefined,
      expect.objectContaining({
        ns: NAMESPACE,
        name: 'pod-1',
        path: 'log',
        queryParams: { container: 'step-proccess-output' },
      }),
    );
    expect(commonFetchText).toHaveBeenCalledWith('/fake-url', {
      pathPrefix: KUBEARCHIVE_PATH_PREFIX,
    });
    expect(extractCveReportFromRawLog).toHaveBeenCalledWith('raw-log-text');
    expect(result).toEqual({ reports: [mockFlatEntries], imagePlatforms: [] });
  });

  it('extracts image platforms from rox-image-scan container log', async () => {
    jest.mocked(getK8sResourceURL).mockImplementation((_model, _undefined, opts) => {
      if (opts?.queryParams?.container === 'step-rox-image-scan') {
        return '/scan-url';
      }
      return '/output-url';
    });
    jest.mocked(commonFetchText).mockImplementation((url) => {
      if (url === '/scan-url') {
        return Promise.resolve('Scanning amd64 image: quay.io/test@sha256:abc');
      }
      return Promise.resolve('raw-log-text');
    });
    jest.mocked(extractCveReportFromRawLog).mockReturnValue([mockFlatEntries]);

    const result = await fetchCveReportFromKubearchive(NAMESPACE, createTaskRun('tr-1', 'pod-1'));

    expect(result.imagePlatforms).toEqual(['linux/amd64']);
  });

  it('throws when TaskRun has no podName', async () => {
    await expect(fetchCveReportFromKubearchive(NAMESPACE, createTaskRun('tr-1'))).rejects.toThrow(
      'TaskRun has no podName',
    );

    expect(commonFetchText).not.toHaveBeenCalled();
  });

  it('throws when the fetch fails', async () => {
    jest.mocked(commonFetchText).mockRejectedValue(new Error('kubearchive down'));

    await expect(
      fetchCveReportFromKubearchive(NAMESPACE, createTaskRun('tr-1', 'pod-1')),
    ).rejects.toThrow('kubearchive down');
  });
});

describe('fetchCveReportFromTektonResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue({ uid: 'pr-uid-1' } as never);
  });

  it('fetches and parses logs via tekton-results', async () => {
    jest.mocked(getTaskRunLog).mockResolvedValue('Scanning amd64 image: quay.io/test@sha256:abc');
    jest.mocked(extractCveReportFromTaskRunLogs).mockReturnValue([mockFlatEntries]);

    const result = await fetchCveReportFromTektonResults(
      NAMESPACE,
      createTaskRun('tr-1', 'pod-1'),
    );

    expect(getTaskRunLog).toHaveBeenCalledWith(NAMESPACE, 'uid-tr-1', 'pr-uid-1');
    expect(extractCveReportFromTaskRunLogs).toHaveBeenCalledWith(
      'Scanning amd64 image: quay.io/test@sha256:abc',
    );
    expect(result).toEqual({
      reports: [mockFlatEntries],
      imagePlatforms: ['linux/amd64'],
    });
  });

  it('throws when TaskRun is missing uid', async () => {
    const bareboneTaskRun = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      metadata: { name: 'tr-bare', namespace: NAMESPACE },
      status: {},
    } as unknown as TaskRunKind;
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue(undefined);

    await expect(
      fetchCveReportFromTektonResults(NAMESPACE, bareboneTaskRun),
    ).rejects.toThrow('TaskRun missing uid/namespace or PipelineRun ownerRef');

    expect(getTaskRunLog).not.toHaveBeenCalled();
  });

  it('throws when PipelineRun ownerRef is missing', async () => {
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue(undefined);

    await expect(
      fetchCveReportFromTektonResults(NAMESPACE, createTaskRun('tr-1', 'pod-1')),
    ).rejects.toThrow('TaskRun missing uid/namespace or PipelineRun ownerRef');
  });

  it('throws when getTaskRunLog fails', async () => {
    jest.mocked(getTaskRunLog).mockRejectedValue(new Error('tekton-results down'));

    await expect(
      fetchCveReportFromTektonResults(NAMESPACE, createTaskRun('tr-1', 'pod-1')),
    ).rejects.toThrow('tekton-results down');
  });
});

describe('resolveRoxctlCveReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(commonFetchText).mockResolvedValue('raw-log-text');
    jest.mocked(extractCveReportFromRawLog).mockReturnValue([mockFlatEntries]);
    jest.mocked(getK8sResourceURL).mockReturnValue('/fake-url');
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue({ uid: 'pr-uid-1' } as never);
    jest.mocked(getTaskRunLog).mockResolvedValue('Scanning amd64 image: quay.io/test@sha256:abc');
    jest.mocked(extractCveReportFromTaskRunLogs).mockReturnValue([mockFlatEntries]);
  });

  it('delegates to kubearchive when flag is ON', async () => {
    const result = await resolveRoxctlCveReport(
      NAMESPACE,
      createTaskRun('tr-1', 'pod-1'),
      true,
    );

    expect(commonFetchText).toHaveBeenCalledWith('/fake-url', {
      pathPrefix: KUBEARCHIVE_PATH_PREFIX,
    });
    expect(getTaskRunLog).not.toHaveBeenCalled();
    expect(result).toEqual({ reports: [mockFlatEntries], imagePlatforms: [] });
  });

  it('delegates to tekton-results when flag is OFF', async () => {
    const result = await resolveRoxctlCveReport(
      NAMESPACE,
      createTaskRun('tr-1', 'pod-1'),
      false,
    );

    expect(getTaskRunLog).toHaveBeenCalledWith(NAMESPACE, 'uid-tr-1', 'pr-uid-1');
    expect(commonFetchText).not.toHaveBeenCalled();
    expect(result).toEqual({ reports: [mockFlatEntries], imagePlatforms: ['linux/amd64'] });
  });

  it('throws when flag is ON and kubearchive fails -- tekton-results is never called', async () => {
    jest.mocked(commonFetchText).mockRejectedValue(new Error('kubearchive down'));

    await expect(
      resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), true),
    ).rejects.toThrow('kubearchive down');

    expect(getTaskRunLog).not.toHaveBeenCalled();
  });

  it('throws when flag is OFF and tekton-results fails -- kubearchive is never called', async () => {
    jest.mocked(getTaskRunLog).mockRejectedValue(new Error('tekton-results down'));

    await expect(
      resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), false),
    ).rejects.toThrow('tekton-results down');

    expect(commonFetchText).not.toHaveBeenCalled();
  });
});

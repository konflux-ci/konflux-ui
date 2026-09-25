import {
  extractCveReportFromRawLog,
  extractCveReportFromTaskRunLogs,
} from '~/components/PipelineRun/VulnerabilitiesTab/roxctl-utils';
import { HttpError } from '~/k8s/error';
import { KUBEARCHIVE_PATH_PREFIX } from '~/kubearchive/const';
import type { TaskRunKind } from '~/types';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import {
  fetchCveReportFromKubearchive,
  fetchCveReportFromTektonResults,
  resolveRoxctlCveReport,
} from '../roxctl-fetchers';
import type { RoxctlFlatCveEntry } from '../types';

jest.mock('~/utils/pod-logs', () => ({ fetchPodContainerLog: jest.fn() }));
jest.mock('~/monitoring/logger', () => ({ logger: { warn: jest.fn() } }));
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
  ...jest.requireActual('~/utils/common-utils'),
  getPipelineRunFromTaskRunOwnerRef: jest.fn(),
}));

const NAMESPACE = 'test-ns';

const fetchPodContainerLog = jest.mocked(jest.requireMock('~/utils/pod-logs').fetchPodContainerLog);

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
    fetchPodContainerLog.mockResolvedValue('raw-log-text');
  });

  it('fetches pod log as text via kubearchive pathPrefix and parses it', async () => {
    jest.mocked(extractCveReportFromRawLog).mockReturnValue([mockFlatEntries]);

    const result = await fetchCveReportFromKubearchive(NAMESPACE, createTaskRun('tr-1', 'pod-1'));

    expect(fetchPodContainerLog).toHaveBeenCalledWith(
      NAMESPACE,
      'pod-1',
      'step-proccess-output',
      KUBEARCHIVE_PATH_PREFIX,
    );
    expect(extractCveReportFromRawLog).toHaveBeenCalledWith('raw-log-text');
    expect(result).toEqual({ reports: [mockFlatEntries], imagePlatforms: [] });
  });

  it('extracts image platforms from rox-image-scan container log', async () => {
    fetchPodContainerLog
      .mockResolvedValueOnce('raw-log-text')
      .mockResolvedValueOnce('Scanning amd64 image: quay.io/test@sha256:abc');
    jest.mocked(extractCveReportFromRawLog).mockReturnValue([mockFlatEntries]);

    const result = await fetchCveReportFromKubearchive(NAMESPACE, createTaskRun('tr-1', 'pod-1'));

    expect(result.imagePlatforms).toEqual(['linux/amd64']);
  });

  it('throws when TaskRun has no podName', async () => {
    await expect(fetchCveReportFromKubearchive(NAMESPACE, createTaskRun('tr-1'))).rejects.toThrow(
      'TaskRun has no podName',
    );

    expect(fetchPodContainerLog).not.toHaveBeenCalled();
  });

  it('throws when the fetch fails', async () => {
    fetchPodContainerLog.mockRejectedValue(new Error('kubearchive down'));

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

    const result = await fetchCveReportFromTektonResults(NAMESPACE, createTaskRun('tr-1', 'pod-1'));

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

    await expect(fetchCveReportFromTektonResults(NAMESPACE, bareboneTaskRun)).rejects.toThrow(
      'TaskRun missing uid/namespace or PipelineRun ownerRef',
    );

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
    fetchPodContainerLog.mockResolvedValue('raw-log-text');
    jest.mocked(extractCveReportFromRawLog).mockReturnValue([mockFlatEntries]);
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue({ uid: 'pr-uid-1' } as never);
    jest.mocked(getTaskRunLog).mockResolvedValue('Scanning amd64 image: quay.io/test@sha256:abc');
    jest.mocked(extractCveReportFromTaskRunLogs).mockReturnValue([mockFlatEntries]);
  });

  it('prefers the live cluster when the archive-log flag is ON', async () => {
    const result = await resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), true);

    expect(fetchPodContainerLog).toHaveBeenCalledWith(
      NAMESPACE,
      'pod-1',
      'step-proccess-output',
      undefined,
    );
    expect(getTaskRunLog).not.toHaveBeenCalled();
    expect(result).toEqual({ reports: [mockFlatEntries], imagePlatforms: [] });
  });

  it('starts both live Pod log requests before either response resolves', async () => {
    let resolveReportLog: (value: string) => void;
    let resolveScanLog: (value: string) => void;
    const reportLog = new Promise<string>((resolve) => {
      resolveReportLog = resolve;
    });
    const scanLog = new Promise<string>((resolve) => {
      resolveScanLog = resolve;
    });
    fetchPodContainerLog.mockReturnValueOnce(reportLog).mockReturnValueOnce(scanLog);

    const resultPromise = resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), true);

    expect(fetchPodContainerLog).toHaveBeenCalledTimes(2);

    resolveReportLog('raw-log-text');
    resolveScanLog('Scanning amd64 image: quay.io/test@sha256:abc');

    await expect(resultPromise).resolves.toEqual({
      reports: [mockFlatEntries],
      imagePlatforms: ['linux/amd64'],
    });
  });

  it('falls back to KubeArchive when the live Pod log is not found', async () => {
    fetchPodContainerLog
      .mockRejectedValueOnce(HttpError.fromCode(404))
      .mockResolvedValue('raw-log-text');

    const result = await resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), true);

    expect(fetchPodContainerLog).toHaveBeenCalledWith(
      NAMESPACE,
      'pod-1',
      'step-proccess-output',
      KUBEARCHIVE_PATH_PREFIX,
    );
    expect(getTaskRunLog).not.toHaveBeenCalled();
    expect(result).toEqual({ reports: [mockFlatEntries], imagePlatforms: [] });
  });

  it('falls back to Tekton Results when the live Pod log is not found and archive logs are off', async () => {
    fetchPodContainerLog.mockRejectedValueOnce(HttpError.fromCode(404));

    const result = await resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), false);

    expect(fetchPodContainerLog).toHaveBeenCalledWith(
      NAMESPACE,
      'pod-1',
      'step-proccess-output',
      undefined,
    );
    expect(getTaskRunLog).toHaveBeenCalledWith(NAMESPACE, 'uid-tr-1', 'pr-uid-1');
    expect(result).toEqual({ reports: [mockFlatEntries], imagePlatforms: ['linux/amd64'] });
  });

  it('propagates a KubeArchive failure after the live Pod is not found', async () => {
    fetchPodContainerLog.mockImplementation((_namespace, _podName, container, pathPrefix) => {
      if (container === 'step-proccess-output' && pathPrefix === undefined) {
        return Promise.reject(HttpError.fromCode(404));
      }
      if (container === 'step-proccess-output' && pathPrefix === KUBEARCHIVE_PATH_PREFIX) {
        return Promise.reject(new Error('kubearchive down'));
      }
      return Promise.resolve('raw-log-text');
    });

    await expect(
      resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), true),
    ).rejects.toThrow('kubearchive down');

    expect(getTaskRunLog).not.toHaveBeenCalled();
  });

  it('propagates a Tekton Results failure after the live Pod is not found', async () => {
    fetchPodContainerLog.mockRejectedValueOnce(HttpError.fromCode(404));
    jest.mocked(getTaskRunLog).mockRejectedValue(new Error('tekton-results down'));

    await expect(
      resolveRoxctlCveReport(NAMESPACE, createTaskRun('tr-1', 'pod-1'), false),
    ).rejects.toThrow('tekton-results down');

    expect(fetchPodContainerLog).toHaveBeenCalledWith(
      NAMESPACE,
      'pod-1',
      'step-proccess-output',
      undefined,
    );
  });
});

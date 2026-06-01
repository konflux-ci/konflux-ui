import { useLocation } from 'react-router-dom';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { extractConformaResultsFromTaskRunLogs } from '~/components/Conforma/utils';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { commonFetchJSON, getK8sResourceURL, K8sListResourceItems } from '~/k8s';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ComponentKind, PipelineRunKind, TaskRunKind } from '~/types';
import { CONFORMA_RESULT_STATUS, type ConformaResult } from '~/types/conforma';
import { getPipelineRunFromTaskRunOwnerRef } from '~/utils/common-utils';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import { generateMockResults } from '../__data__/mockConformaResults';
import {
  useApplicationConformaResults,
  type ApplicationConformaResults,
} from '../useApplicationConformaResults';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('~/shared/hooks/useDeepCompareMemoize', () =>
  jest.requireActual('~/shared/hooks/useDeepCompareMemoize'),
);

jest.mock('~/k8s', () => ({
  commonFetchJSON: jest.fn(),
  getK8sResourceURL: jest.fn(() => '/fake-url'),
  K8sListResourceItems: jest.fn(),
}));

jest.mock('~/utils/tekton-results', () => ({
  getTaskRunLog: jest.fn(),
}));

jest.mock('~/components/Conforma/utils', () => ({
  extractConformaResultsFromTaskRunLogs: jest.fn(),
}));

jest.mock('~/utils/conforma-utils', () => ({
  isResourceEnterpriseContract: jest.fn(),
}));

jest.mock('~/utils/pipeline-utils', () => ({
  isTaskRunInPipelineRun: jest.fn(),
}));

jest.mock('~/utils/common-utils', () => ({
  getPipelineRunFromTaskRunOwnerRef: jest.fn(),
}));

jest.mock('~/hooks/useTaskRuns', () => ({
  sortTaskRunsByTime: jest.fn((v) => v),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('../__data__/mockConformaResults', () => ({
  generateMockResults: jest.fn(),
}));

const mockUseLocation = useLocation as jest.Mock;
const mockUseComponents = useComponents as jest.Mock;
const mockUsePipelineRunsV2 = usePipelineRunsV2 as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockGenerateMockResults = generateMockResults as jest.Mock;

const createComponent = (name: string): ComponentKind => ({
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Component',
  metadata: { name, namespace: 'test-ns' },
  spec: {
    application: 'test-app',
    componentName: name,
    source: { git: { url: 'https://example.com/repo.git' } },
  },
});

const createPipelineRun = (
  name: string,
  componentName: string,
  timestamp = '2026-01-01T00:00:00Z',
): PipelineRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name,
      namespace: 'test-ns',
      creationTimestamp: timestamp,
      labels: {
        'pipelines.appstudio.openshift.io/type': 'test',
        'appstudio.openshift.io/application': 'test-app',
        'appstudio.openshift.io/component': componentName,
      },
    },
    spec: {},
  }) as unknown as PipelineRunKind;

const createTaskRun = (name: string, podName: string): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name,
      namespace: 'test-ns',
      uid: `uid-${name}`,
      ownerReferences: [{ kind: 'PipelineRun', uid: 'pr-uid-1' }],
    },
    status: { podName },
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
            solution: 'Run a CVE scan',
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
            solution: 'Update API version',
          },
          msg: 'API v1 is deprecated',
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
          msg: 'Base image check passed',
        },
      ],
    },
  ],
};

const mockApplicationResults: ApplicationConformaResults = {
  componentStatuses: [
    {
      componentName: 'comp-a',
      status: 'fail',
      violationCount: 1,
      warningCount: 0,
      successCount: 0,
    },
  ],
  allResults: [
    {
      title: 'Mock violation',
      description: 'Mock violation description',
      status: CONFORMA_RESULT_STATUS.violations,
      component: 'comp-a',
      msg: 'mock msg',
    },
  ],
  totalComponents: 1,
  totalFailed: 1,
  totalViolations: 1,
  totalWarnings: 0,
  totalSuccesses: 0,
  loaded: true,
  error: undefined,
};

const flushEffects = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

const setupFetchPipeline = () => {
  const components = [createComponent('comp-a')];
  const pipelineRuns = [createPipelineRun('pr-1', 'comp-a')];
  const taskRuns = [createTaskRun('tr-1', 'pod-1')];

  mockUseComponents.mockReturnValue([components, true, undefined]);
  mockUsePipelineRunsV2.mockReturnValue([pipelineRuns, true, undefined]);
  jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);
  jest.mocked(K8sListResourceItems).mockResolvedValue(taskRuns);
  jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue({ uid: 'pr-uid-1' } as never);

  return { components, pipelineRuns, taskRuns };
};

describe('useApplicationConformaResults', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocation.mockReturnValue({ search: '' });
    mockUseNamespace.mockReturnValue('test-ns');
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseComponents.mockReturnValue([[], true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);
    mockGenerateMockResults.mockReturnValue(mockApplicationResults);

    jest.mocked(K8sListResourceItems).mockResolvedValue([]);
    jest.mocked(commonFetchJSON).mockResolvedValue(undefined);
    jest.mocked(getK8sResourceURL).mockReturnValue('/fake-url');
    jest.mocked(getTaskRunLog).mockResolvedValue('');
    jest.mocked(extractConformaResultsFromTaskRunLogs).mockReturnValue(undefined);
    jest.mocked(isResourceEnterpriseContract).mockReturnValue(false);
    jest.mocked(isTaskRunInPipelineRun).mockReturnValue(false);
    jest.mocked(getPipelineRunFromTaskRunOwnerRef).mockReturnValue(undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns empty initial state when namespace is empty', () => {
    mockUseNamespace.mockReturnValue('');

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    expect(result.current).toEqual({
      componentStatuses: [],
      allResults: [],
      totalComponents: 0,
      totalFailed: 0,
      totalViolations: 0,
      totalWarnings: 0,
      totalSuccesses: 0,
      loaded: false,
      error: undefined,
    });
  });

  it('returns loading state when components are not loaded yet', () => {
    mockUseComponents.mockReturnValue([[], false, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    expect(result.current.loaded).toBe(false);
  });

  it('returns mock data when in development mode with mock param', () => {
    process.env.NODE_ENV = 'development';
    mockUseLocation.mockReturnValue({ search: '?mock=conforma' });

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    expect(mockGenerateMockResults).toHaveBeenCalled();
    expect(result.current).toEqual(mockApplicationResults);
  });

  it('returns loaded empty state when there are no pipeline runs', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
    expect(result.current.totalComponents).toBe(2);
    expect(result.current.error).toBeUndefined();
  });

  it('returns components error when useComponents has an error', async () => {
    const componentsError = new Error('comp error');
    mockUseComponents.mockReturnValue([[], true, componentsError]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(componentsError);
  });

  it('returns pipelines error when usePipelineRunsV2 has an error', async () => {
    const pipelinesError = new Error('pipeline error');
    mockUsePipelineRunsV2.mockReturnValue([[], true, pipelinesError]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(pipelinesError);
  });

  it('does not use mock data in production mode', async () => {
    process.env.NODE_ENV = 'production';
    mockUseLocation.mockReturnValue({ search: '?mock=conforma' });

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(mockGenerateMockResults).not.toHaveBeenCalled();
    expect(result.current).not.toEqual(mockApplicationResults);
    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
  });

  it('fetches and aggregates conforma results for qualifying pipelines', async () => {
    setupFetchPipeline();
    jest.mocked(commonFetchJSON).mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(1);
    expect(result.current.totalWarnings).toBe(1);
    expect(result.current.totalSuccesses).toBe(1);
    expect(result.current.totalFailed).toBe(1);
    expect(result.current.allResults).toHaveLength(3);
    expect(result.current.componentStatuses[0].status).toBe('fail');
  });

  it('maps violation rows with solution and image fields', async () => {
    setupFetchPipeline();
    jest.mocked(commonFetchJSON).mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    const violation = result.current.allResults.find(
      (r) => r.status === CONFORMA_RESULT_STATUS.violations,
    );
    expect(violation?.title).toBe('Missing CVE scan');
    expect(violation?.solution).toBe('Run a CVE scan');
    expect(violation?.image).toBe('quay.io/test/image@sha256:abc');
  });

  it('maps warning rows with solution field', async () => {
    setupFetchPipeline();
    jest.mocked(commonFetchJSON).mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    const warning = result.current.allResults.find(
      (r) => r.status === CONFORMA_RESULT_STATUS.warnings,
    );
    expect(warning?.title).toBe('Deprecated API');
    expect(warning?.solution).toBe('Update API version');
  });

  it('maps success rows correctly', async () => {
    setupFetchPipeline();
    jest.mocked(commonFetchJSON).mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    const success = result.current.allResults.find(
      (r) => r.status === CONFORMA_RESULT_STATUS.successes,
    );
    expect(success?.title).toBe('Base image allowed');
    expect(success?.component).toBe('comp-a');
  });

  it('sets component status to pass when only successes exist', async () => {
    const passResult: ConformaResult = {
      components: [
        {
          containerImage: 'quay.io/test/img',
          name: 'comp-a',
          success: true,
          successes: [
            {
              metadata: {
                title: 'Check passed',
                description: 'All good',
                collections: [],
                code: 'ok',
              },
              msg: 'passed',
            },
          ],
        },
      ],
    };
    setupFetchPipeline();
    jest.mocked(commonFetchJSON).mockResolvedValue(passResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.componentStatuses[0].status).toBe('pass');
    expect(result.current.totalFailed).toBe(0);
  });

  it('sets component status to warning when warnings but no violations', async () => {
    const warnResult: ConformaResult = {
      components: [
        {
          containerImage: 'quay.io/test/img',
          name: 'comp-a',
          success: true,
          warnings: [
            {
              metadata: {
                title: 'Minor issue',
                description: 'Not critical',
                collections: [],
                code: 'warn',
              },
              msg: 'warning',
            },
          ],
        },
      ],
    };
    setupFetchPipeline();
    jest.mocked(commonFetchJSON).mockResolvedValue(warnResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.componentStatuses[0].status).toBe('warning');
  });

  it('sets component status to unknown for components without conforma data', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    const pipelineRuns = [createPipelineRun('pr-1', 'comp-a')];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([pipelineRuns, true, undefined]);
    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);
    jest.mocked(K8sListResourceItems).mockResolvedValue([]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    const compB = result.current.componentStatuses.find((c) => c.componentName === 'comp-b');
    expect(compB?.status).toBe('unknown');
  });

  it('handles fetch errors gracefully and sets component status to unknown', async () => {
    setupFetchPipeline();
    const nonRetryableError = Object.assign(new Error('server error'), { code: 500 });
    jest.mocked(commonFetchJSON).mockRejectedValue(nonRetryableError);
    jest.mocked(getTaskRunLog).mockRejectedValue(new Error('log fetch failed'));

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.componentStatuses[0].status).toBe('unknown');
    expect(result.current.allResults).toEqual([]);
  });

  it('skips pipeline runs without component label', async () => {
    const prNoLabel = {
      ...createPipelineRun('pr-no-label', 'comp-a'),
    } as unknown as PipelineRunKind;
    delete (prNoLabel.metadata as Record<string, unknown>).labels;

    mockUseComponents.mockReturnValue([[createComponent('comp-a')], true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[prNoLabel], true, undefined]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
  });

  it('skips pipeline runs without security task', async () => {
    mockUseComponents.mockReturnValue([[createComponent('comp-a')], true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([
      [createPipelineRun('pr-1', 'comp-a')],
      true,
      undefined,
    ]);
    jest.mocked(isResourceEnterpriseContract).mockReturnValue(false);
    jest.mocked(isTaskRunInPipelineRun).mockReturnValue(false);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
    expect(K8sListResourceItems).not.toHaveBeenCalled();
  });

  it('uses CONFORMA_TASK when isTaskRunInPipelineRun matches', async () => {
    mockUseComponents.mockReturnValue([[createComponent('comp-a')], true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([
      [createPipelineRun('pr-1', 'comp-a')],
      true,
      undefined,
    ]);
    jest.mocked(isResourceEnterpriseContract).mockReturnValue(false);
    jest.mocked(isTaskRunInPipelineRun).mockReturnValue(true);
    jest.mocked(K8sListResourceItems).mockResolvedValue([]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(K8sListResourceItems).toHaveBeenCalled();
    expect(result.current.loaded).toBe(true);
  });

  it('filters out invalid 404 image conforma rows', async () => {
    const resultWith404: ConformaResult = {
      components: [
        {
          containerImage: 'quay.io/test/missing',
          name: 'comp-a',
          success: false,
          violations: [{ msg: 'error: 404 Not Found' } as never],
        },
      ],
    };
    setupFetchPipeline();
    jest.mocked(commonFetchJSON).mockResolvedValue(resultWith404);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(result.current.allResults).toEqual([]);
  });

  it('falls back to tekton-results logs when pod log returns 404', async () => {
    setupFetchPipeline();
    const err404 = Object.assign(new Error('not found'), { code: 404 });
    jest.mocked(commonFetchJSON).mockRejectedValue(err404);
    jest.mocked(getTaskRunLog).mockResolvedValue('some-logs');
    jest.mocked(extractConformaResultsFromTaskRunLogs).mockReturnValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(getTaskRunLog).toHaveBeenCalled();
    expect(result.current.allResults.length).toBeGreaterThan(0);
  });

  it('tries kubearchive when pod log 404 and kubearchive is enabled', async () => {
    setupFetchPipeline();
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    const err404 = Object.assign(new Error('not found'), { code: 404 });
    jest
      .mocked(commonFetchJSON)
      .mockRejectedValueOnce(err404)
      .mockResolvedValueOnce(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    expect(commonFetchJSON).toHaveBeenCalledTimes(2);
    expect(result.current.allResults.length).toBeGreaterThan(0);
  });

  it('picks the latest pipeline run per component by timestamp', async () => {
    const components = [createComponent('comp-a')];
    const olderPr = createPipelineRun('pr-old', 'comp-a', '2025-01-01T00:00:00Z');
    const newerPr = createPipelineRun('pr-new', 'comp-a', '2026-06-01T00:00:00Z');
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[olderPr, newerPr], true, undefined]);
    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);
    jest.mocked(K8sListResourceItems).mockResolvedValue([]);

    renderHook(() => useApplicationConformaResults('test-app'));

    await flushEffects();

    const callArgs = (K8sListResourceItems as jest.Mock).mock.calls[0]?.[0];
    expect(callArgs?.queryOptions?.queryParams?.labelSelector?.matchLabels).toEqual(
      expect.objectContaining({ 'tekton.dev/pipelineRun': 'pr-new' }),
    );
  });
});

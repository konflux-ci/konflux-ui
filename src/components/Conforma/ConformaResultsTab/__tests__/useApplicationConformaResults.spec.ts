import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-hooks';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useComponents } from '~/hooks/useComponents';
import { useTaskRunsV2 } from '~/hooks/useTaskRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ComponentKind, TaskRunKind } from '~/types';
import { CONFORMA_RESULT_STATUS, type ConformaResult } from '~/types/conforma';
import { resolveConformaResultFromTaskRun } from '../conforma-fetchers';
import { useApplicationConformaResults } from '../useApplicationConformaResults';
import '@testing-library/jest-dom';

jest.mock('~/hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsV2: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('../conforma-fetchers', () => ({
  resolveConformaResultFromTaskRun: jest.fn(),
  filterInvalidImageConformaRows:
    jest.requireActual('../conforma-fetchers').filterInvalidImageConformaRows,
  mapConformaResultData: jest.requireActual('../conforma-fetchers').mapConformaResultData,
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockUseComponents = useComponents as jest.Mock;
const mockUseTaskRunsV2 = useTaskRunsV2 as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockResolveConforma = resolveConformaResultFromTaskRun as jest.Mock;

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

const createSecurityTaskRun = (
  name: string,
  componentName: string,
  podName: string,
  timestamp = '2026-01-01T00:00:00Z',
  pipelineRunName = 'pr-1',
): TaskRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'TaskRun',
    metadata: {
      name,
      namespace: 'test-ns',
      uid: `uid-${name}`,
      creationTimestamp: timestamp,
      labels: {
        'appstudio.openshift.io/application': 'test-app',
        'appstudio.openshift.io/component': componentName,
        'pipelines.appstudio.openshift.io/type': 'test',
        'tekton.dev/pipelineTask': 'verify',
        'tekton.dev/pipelineRun': pipelineRunName,
      },
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

let queryClient: QueryClient;

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const flushEffects = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

const setupTaskRunPipeline = () => {
  const components = [createComponent('comp-a')];
  const taskRuns = [createSecurityTaskRun('tr-1', 'comp-a', 'pod-1')];

  mockUseComponents.mockReturnValue([components, true, undefined]);
  mockUseTaskRunsV2.mockReturnValue([taskRuns, true, undefined, jest.fn(), {}]);

  return { components, taskRuns };
};

describe('useApplicationConformaResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    mockUseNamespace.mockReturnValue('test-ns');
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseComponents.mockReturnValue([[], true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([[], true, undefined, jest.fn(), {}]);
    mockResolveConforma.mockResolvedValue(undefined);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('returns empty initial state when namespace is empty', () => {
    mockUseNamespace.mockReturnValue('');

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    expect(result.current).toEqual({
      componentStatuses: [],
      allResults: [],
      totalComponents: 0,
      totalFailed: 0,
      totalViolations: 0,
      totalWarnings: 0,
      totalSuccesses: 0,
      loaded: false,
      settling: false,
      error: undefined,
    });
  });

  it('returns loading state when components are not loaded yet', () => {
    mockUseComponents.mockReturnValue([[], false, undefined]);
    mockUseTaskRunsV2.mockReturnValue([[], false, undefined, jest.fn(), {}]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    expect(result.current.loaded).toBe(false);
  });

  it('returns loaded empty state when there are no task runs', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([[], true, undefined, jest.fn(), {}]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
    expect(result.current.totalComponents).toBe(2);
    expect(result.current.error).toBeUndefined();
  });

  it('returns components error when useComponents has an error', async () => {
    const componentsError = new Error('comp error');
    mockUseComponents.mockReturnValue([[], true, componentsError]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(componentsError);
  });

  it('returns taskRuns error when useTaskRunsV2 has an error', async () => {
    const taskRunsError = new Error('taskrun error');
    mockUseTaskRunsV2.mockReturnValue([[], true, taskRunsError, jest.fn(), {}]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(taskRunsError);
  });

  it('fetches and aggregates conforma results for security TaskRuns', async () => {
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

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
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    const violation = result.current.allResults.find(
      (r) => r.status === CONFORMA_RESULT_STATUS.violations,
    );
    expect(violation?.title).toBe('Missing CVE scan');
    expect(violation?.solution).toBe('Run a CVE scan');
    expect(violation?.image).toBe('quay.io/test/image@sha256:abc');
  });

  it('maps warning rows with solution field', async () => {
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    const warning = result.current.allResults.find(
      (r) => r.status === CONFORMA_RESULT_STATUS.warnings,
    );
    expect(warning?.title).toBe('Deprecated API');
    expect(warning?.solution).toBe('Update API version');
  });

  it('maps success rows correctly', async () => {
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

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
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(passResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

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
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(warnResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.componentStatuses[0].status).toBe('warning');
  });

  it('sets component status to unknown for components without conforma data', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    const taskRuns = [createSecurityTaskRun('tr-1', 'comp-a', 'pod-1')];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([taskRuns, true, undefined, jest.fn(), {}]);
    mockResolveConforma.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    const compB = result.current.componentStatuses.find((c) => c.componentName === 'comp-b');
    expect(compB?.status).toBe('unknown');
  });

  it('sets error when the only component query fails', async () => {
    setupTaskRunPipeline();
    mockResolveConforma.mockRejectedValue(new Error('resolve failed'));

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.componentStatuses[0].status).toBe('unknown');
    expect(result.current.allResults).toEqual([]);
  });

  it('skips task runs without component label', async () => {
    const trNoLabel = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      metadata: {
        name: 'tr-no-label',
        namespace: 'test-ns',
        uid: 'uid-no-label',
        creationTimestamp: '2026-01-01T00:00:00Z',
        labels: {
          'pipelines.appstudio.openshift.io/type': 'test',
          'tekton.dev/pipelineTask': 'verify',
        },
      },
      status: { podName: 'pod-1' },
    } as unknown as TaskRunKind;

    mockUseComponents.mockReturnValue([[createComponent('comp-a')], true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([[trNoLabel], true, undefined, jest.fn(), {}]);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.allResults).toEqual([]);
    expect(mockResolveConforma).not.toHaveBeenCalled();
  });

  it('filters out individual 404 violation rows but keeps other violations for the same component', async () => {
    const resultWith404AndValid: ConformaResult = {
      components: [
        {
          containerImage: 'quay.io/test/missing',
          name: 'comp-a',
          success: false,
          violations: [
            { msg: 'error: 404 Not Found' } as never,
            {
              metadata: {
                title: 'Real violation',
                description: 'This is a real issue',
                collections: [],
                code: 'real.issue',
              },
              msg: 'Real violation message',
            },
          ],
        },
      ],
    };
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(resultWith404AndValid);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.allResults).toHaveLength(1);
    expect(result.current.allResults[0].title).toBe('Real violation');
  });

  it('filters out a 404-only violation row when no other violations exist', async () => {
    const resultWith404Only: ConformaResult = {
      components: [
        {
          containerImage: 'quay.io/test/missing',
          name: 'comp-a',
          success: false,
          violations: [{ msg: 'error: 404 Not Found' } as never],
        },
      ],
    };
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(resultWith404Only);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.allResults).toEqual([]);
  });

  it('picks the latest TaskRun per component by timestamp', async () => {
    const components = [createComponent('comp-a')];
    const olderTr = createSecurityTaskRun(
      'tr-old',
      'comp-a',
      'pod-old',
      '2025-01-01T00:00:00Z',
      'pr-old',
    );
    const newerTr = createSecurityTaskRun(
      'tr-new',
      'comp-a',
      'pod-new',
      '2026-06-01T00:00:00Z',
      'pr-new',
    );
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([[olderTr, newerTr], true, undefined, jest.fn(), {}]);
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(mockResolveConforma).toHaveBeenCalledTimes(1);
    expect(mockResolveConforma).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'tr-new' }) }),
      false,
    );
    expect(result.current.componentStatuses[0].pipelineRunName).toBe('pr-new');
  });

  it('breaks timestamp ties by choosing the lexicographically greater TaskRun name', async () => {
    const components = [createComponent('comp-a')];
    const sameTimestamp = '2026-06-01T00:00:00Z';
    const trAlpha = createSecurityTaskRun('tr-alpha', 'comp-a', 'pod-a', sameTimestamp, 'pr-alpha');
    const trBeta = createSecurityTaskRun('tr-beta', 'comp-a', 'pod-b', sameTimestamp, 'pr-beta');
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([[trAlpha, trBeta], true, undefined, jest.fn(), {}]);
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(mockResolveConforma).toHaveBeenCalledTimes(1);
    expect(mockResolveConforma).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'tr-beta' }) }),
      false,
    );
  });

  it('does not set error when only some component queries fail', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    const taskRuns = [
      createSecurityTaskRun('tr-1', 'comp-a', 'pod-1'),
      createSecurityTaskRun('tr-2', 'comp-b', 'pod-2'),
    ];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([taskRuns, true, undefined, jest.fn(), {}]);
    mockResolveConforma
      .mockResolvedValueOnce(mockConformaResult)
      .mockRejectedValueOnce(new Error('network error'));

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.error).toBeUndefined();
  });

  it('sets error when all component queries fail', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    const taskRuns = [
      createSecurityTaskRun('tr-1', 'comp-a', 'pod-1'),
      createSecurityTaskRun('tr-2', 'comp-b', 'pod-2'),
    ];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([taskRuns, true, undefined, jest.fn(), {}]);
    mockResolveConforma.mockRejectedValue(new Error('total failure'));

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.error).toBeTruthy();
  });

  it('passes the correct selector to useTaskRunsV2', () => {
    renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    expect(mockUseTaskRunsV2).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            'appstudio.openshift.io/application': 'test-app',
            'pipelines.appstudio.openshift.io/type': 'test',
          }),
          matchExpressions: [
            expect.objectContaining({
              key: 'tekton.dev/pipelineTask',
              operator: 'In',
              values: ['verify', 'verify-conforma'],
            }),
          ],
        }),
      }),
    );
  });

  it('reports loaded=true and settling=true while log queries are in-flight', async () => {
    setupTaskRunPipeline();
    let resolvePromise: (v: ConformaResult) => void;
    const pending = new Promise<ConformaResult>((r) => {
      resolvePromise = r;
    });
    mockResolveConforma.mockReturnValue(pending);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    expect(result.current.loaded).toBe(true);
    expect(result.current.settling).toBe(true);

    await act(async () => {
      resolvePromise(mockConformaResult);
      await pending;
    });
    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.settling).toBe(false);
  });

  it('returns partial data while some queries are still loading', async () => {
    const components = [createComponent('comp-a'), createComponent('comp-b')];
    const taskRuns = [
      createSecurityTaskRun('tr-1', 'comp-a', 'pod-1'),
      createSecurityTaskRun('tr-2', 'comp-b', 'pod-2'),
    ];
    mockUseComponents.mockReturnValue([components, true, undefined]);
    mockUseTaskRunsV2.mockReturnValue([taskRuns, true, undefined, jest.fn(), {}]);

    let resolveSecond: (v: ConformaResult) => void;
    const pendingSecond = new Promise<ConformaResult>((r) => {
      resolveSecond = r;
    });
    mockResolveConforma
      .mockResolvedValueOnce(mockConformaResult)
      .mockReturnValueOnce(pendingSecond);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.settling).toBe(true);
    expect(result.current.allResults.length).toBeGreaterThan(0);

    await act(async () => {
      resolveSecond(mockConformaResult);
      await pendingSecond;
    });
    await flushEffects();

    expect(result.current.settling).toBe(false);
  });

  it('settling becomes false when all queries complete', async () => {
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.settling).toBe(false);
  });

  it('preserves pipelineRunName on componentStatuses from TaskRun labels', async () => {
    setupTaskRunPipeline();
    mockResolveConforma.mockResolvedValue(mockConformaResult);

    const { result } = renderHook(() => useApplicationConformaResults('test-app'), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.componentStatuses[0].pipelineRunName).toBe('pr-1');
  });
});

import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { isDeveloperMockMode, MOCK_WORKSPACE_CONFORMA_VIOLATIONS } from '~/dev-mock';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useApplications } from '~/hooks/useApplications';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { commonFetchJSON, getK8sResourceURL, K8sListResourceItems } from '~/k8s';
import { useNamespace } from '~/shared/providers/Namespace';
import { isResourceEnterpriseContract } from '~/utils/conforma-utils';
import { isTaskRunInPipelineRun } from '~/utils/pipeline-utils';
import { useWorkspaceConformaViolations } from '../useWorkspaceConformaViolations';

jest.mock('~/hooks/useApplications', () => ({
  useApplications: jest.fn(),
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

jest.mock('~/utils/conforma-utils', () => ({
  isResourceEnterpriseContract: jest.fn(),
}));

jest.mock('~/utils/pipeline-utils', () => ({
  isTaskRunInPipelineRun: jest.fn(),
}));

jest.mock('~/utils/common-utils', () => ({
  getPipelineRunFromTaskRunOwnerRef: jest.fn(() => ({ uid: 'pr-uid' })),
}));

jest.mock('~/hooks/useTaskRuns', () => ({
  sortTaskRunsByTime: jest.fn((v) => v),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock('~/dev-mock', () => {
  const actual = jest.requireActual('~/dev-mock/mockWorkspaceConformaViolations');
  return {
    isDeveloperMockMode: jest.fn(),
    MOCK_WORKSPACE_CONFORMA_VIOLATIONS: actual.buildMockWorkspaceConformaViolations(2),
  };
});

jest.mock('~/components/Conforma/utils', () => ({
  extractConformaResultsFromTaskRunLogs: jest.fn(),
}));

jest.mock('~/utils/tekton-results', () => ({
  getTaskRunLog: jest.fn(),
}));

const mockIsDeveloperMockMode = isDeveloperMockMode as jest.Mock;
const mockUseApplications = useApplications as jest.Mock;
const mockUsePipelineRunsV2 = usePipelineRunsV2 as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useWorkspaceConformaViolations', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockIsDeveloperMockMode.mockReturnValue(false);
    mockUseNamespace.mockReturnValue('test-ns');
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseApplications.mockReturnValue([[], true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);

    jest.mocked(K8sListResourceItems).mockResolvedValue([]);
    jest.mocked(commonFetchJSON).mockResolvedValue(undefined);
    jest.mocked(getK8sResourceURL).mockReturnValue('/fake-url');
    jest.mocked(isResourceEnterpriseContract).mockReturnValue(false);
    jest.mocked(isTaskRunInPipelineRun).mockReturnValue(false);
  });

  it('returns mock violations when developer mock mode is enabled', () => {
    mockIsDeveloperMockMode.mockReturnValue(true);
    mockUseApplications.mockReturnValue([undefined, true, undefined] as never);

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current).toEqual(MOCK_WORKSPACE_CONFORMA_VIOLATIONS);
  });

  it('should return empty state when no applications exist', async () => {
    const { result } = renderHook(() => useWorkspaceConformaViolations());
    await flushEffects();

    expect(result.current.applications).toEqual([]);
    expect(result.current.totalViolations).toBe(0);
    expect(result.current.totalWarnings).toBe(0);
    expect(result.current.loaded).toBe(true);
  });

  it('should return loaded=false while applications are loading', () => {
    mockUseApplications.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(false);
  });

  it('should return loaded=false while pipeline runs are loading', () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-1' } }],
      true,
      undefined,
    ]);
    mockUsePipelineRunsV2.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(false);
  });

  it('should aggregate violations across applications', async () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-1' } }, { metadata: { name: 'app-2' } }],
      true,
      undefined,
    ]);

    mockUsePipelineRunsV2.mockReturnValue([
      [
        {
          metadata: {
            name: 'pr-1',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-1',
              'appstudio.openshift.io/component': 'comp-a',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
        {
          metadata: {
            name: 'pr-2',
            creationTimestamp: '2025-01-01T11:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-2',
              'appstudio.openshift.io/component': 'comp-b',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
      ],
      true,
      undefined,
    ]);

    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);

    jest.mocked(K8sListResourceItems).mockResolvedValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'TaskRun',
        metadata: { name: 'task-run-1', namespace: 'test-ns', uid: 'uid-1' },
        status: { podName: 'pod-1' },
      },
    ]);

    jest.mocked(commonFetchJSON).mockResolvedValue({
      components: [
        {
          name: 'comp-a',
          containerImage: 'image:latest',
          violations: [
            { msg: 'violation 1', metadata: { title: 'v1' } },
            { msg: 'violation 2', metadata: { title: 'v2' } },
          ],
          warnings: [{ msg: 'warn 1', metadata: { title: 'w1' } }],
          successes: [],
        },
      ],
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());
    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(4);
    expect(result.current.totalWarnings).toBe(2);
    expect(result.current.applications).toHaveLength(2);
  });

  it('should only include apps with violations or warnings in the result', async () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-clean' } }, { metadata: { name: 'app-dirty' } }],
      true,
      undefined,
    ]);

    mockUsePipelineRunsV2.mockReturnValue([
      [
        {
          metadata: {
            name: 'pr-clean',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-clean',
              'appstudio.openshift.io/component': 'comp-clean',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
        {
          metadata: {
            name: 'pr-dirty',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-dirty',
              'appstudio.openshift.io/component': 'comp-dirty',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
      ],
      true,
      undefined,
    ]);

    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);

    jest.mocked(K8sListResourceItems).mockResolvedValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'TaskRun',
        metadata: { name: 'task-run', namespace: 'test-ns', uid: 'uid' },
        status: { podName: 'pod' },
      },
    ]);

    let callCount = 0;
    jest.mocked(commonFetchJSON).mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        return Promise.resolve({
          components: [{ name: 'comp-clean', successes: [{ msg: 'ok' }] }],
        });
      }
      return Promise.resolve({
        components: [
          { name: 'comp-dirty', violations: [{ msg: 'bad', metadata: { title: 'v' } }] },
        ],
      });
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());
    await flushEffects();

    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0].applicationName).toBe('app-dirty');
    expect(result.current.totalViolations).toBe(1);
  });

  it('should propagate application loading error', () => {
    const appError = { code: 403, message: 'Forbidden' };
    mockUseApplications.mockReturnValue([[], true, appError]);

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.error).toEqual(appError);
  });

  it('should propagate pipeline run loading error', () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-1' } }],
      true,
      undefined,
    ]);
    const prError = { code: 500, message: 'Internal' };
    mockUsePipelineRunsV2.mockReturnValue([[], true, prError]);

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.error).toEqual(prError);
  });

  it('should surface fetch error when all pipeline fetches fail', async () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-1' } }],
      true,
      undefined,
    ]);

    mockUsePipelineRunsV2.mockReturnValue([
      [
        {
          metadata: {
            name: 'pr-1',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-1',
              'appstudio.openshift.io/component': 'comp-a',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
      ],
      true,
      undefined,
    ]);

    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);

    const fetchErr = new Error('Network failure');
    jest.mocked(K8sListResourceItems).mockRejectedValue(fetchErr);

    const { result } = renderHook(() => useWorkspaceConformaViolations());
    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(fetchErr);
    expect(result.current.applications).toEqual([]);
  });

  it('should clear error state on subsequent successful fetch after failure', async () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-1' } }],
      true,
      undefined,
    ]);

    const pipelineRun = {
      metadata: {
        name: 'pr-1',
        creationTimestamp: '2025-01-01T10:00:00Z',
        labels: {
          'appstudio.openshift.io/application': 'app-1',
          'appstudio.openshift.io/component': 'comp-a',
          'pipelines.appstudio.openshift.io/type': 'test',
        },
      },
    };

    mockUsePipelineRunsV2.mockReturnValue([[pipelineRun], true, undefined]);

    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);

    const fetchErr = new Error('Network failure');
    jest.mocked(K8sListResourceItems).mockRejectedValue(fetchErr);

    const { result, rerender } = renderHook(() => useWorkspaceConformaViolations());
    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(fetchErr);

    jest.mocked(K8sListResourceItems).mockResolvedValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'TaskRun',
        metadata: { name: 'task-run-1', namespace: 'test-ns', uid: 'uid-1' },
        status: { podName: 'pod-1' },
      },
    ]);

    jest.mocked(commonFetchJSON).mockResolvedValue({
      components: [
        {
          name: 'comp-a',
          violations: [{ msg: 'violation 1', metadata: { title: 'v1' } }],
          warnings: [],
          successes: [],
        },
      ],
    });

    mockUsePipelineRunsV2.mockReturnValue([
      [
        {
          ...pipelineRun,
          metadata: {
            ...pipelineRun.metadata,
            name: 'pr-2',
          },
        },
      ],
      true,
      undefined,
    ]);

    rerender();
    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('should not surface error when only some pipeline fetches fail', async () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-ok' } }, { metadata: { name: 'app-fail' } }],
      true,
      undefined,
    ]);

    mockUsePipelineRunsV2.mockReturnValue([
      [
        {
          metadata: {
            name: 'pr-ok',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-ok',
              'appstudio.openshift.io/component': 'comp-ok',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
        {
          metadata: {
            name: 'pr-fail',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-fail',
              'appstudio.openshift.io/component': 'comp-fail',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
      ],
      true,
      undefined,
    ]);

    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);

    let callCount = 0;
    jest.mocked(K8sListResourceItems).mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        return Promise.resolve([
          {
            apiVersion: 'tekton.dev/v1',
            kind: 'TaskRun',
            metadata: { name: 'task-run', namespace: 'test-ns', uid: 'uid' },
            status: { podName: 'pod' },
          },
        ] as never);
      }
      return Promise.reject(new Error('Network failure'));
    });

    jest.mocked(commonFetchJSON).mockResolvedValue({
      components: [
        { name: 'comp-ok', violations: [{ msg: 'v', metadata: { title: 'v' } }] },
      ],
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());
    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.applications).toHaveLength(1);
  });

  it('should sort applications by violation count descending', async () => {
    mockUseApplications.mockReturnValue([
      [{ metadata: { name: 'app-low' } }, { metadata: { name: 'app-high' } }],
      true,
      undefined,
    ]);

    mockUsePipelineRunsV2.mockReturnValue([
      [
        {
          metadata: {
            name: 'pr-low',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-low',
              'appstudio.openshift.io/component': 'comp-low',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
        {
          metadata: {
            name: 'pr-high',
            creationTimestamp: '2025-01-01T10:00:00Z',
            labels: {
              'appstudio.openshift.io/application': 'app-high',
              'appstudio.openshift.io/component': 'comp-high',
              'pipelines.appstudio.openshift.io/type': 'test',
            },
          },
        },
      ],
      true,
      undefined,
    ]);

    jest.mocked(isResourceEnterpriseContract).mockReturnValue(true);

    jest.mocked(K8sListResourceItems).mockResolvedValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'TaskRun',
        metadata: { name: 'task-run', namespace: 'test-ns', uid: 'uid' },
        status: { podName: 'pod' },
      },
    ]);

    let callCount = 0;
    jest.mocked(commonFetchJSON).mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        return Promise.resolve({
          components: [
            { name: 'comp-low', violations: [{ msg: 'v', metadata: { title: 'v' } }] },
          ],
        });
      }
      return Promise.resolve({
        components: [
          {
            name: 'comp-high',
            violations: [
              { msg: 'v1', metadata: { title: 'v1' } },
              { msg: 'v2', metadata: { title: 'v2' } },
              { msg: 'v3', metadata: { title: 'v3' } },
            ],
          },
        ],
      });
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());
    await flushEffects();

    expect(result.current.applications[0].applicationName).toBe('app-high');
    expect(result.current.applications[1].applicationName).toBe('app-low');
  });
});

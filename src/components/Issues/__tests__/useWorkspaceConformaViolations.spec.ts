import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-hooks';
import {
  fetchConformaForPipeline,
  securityTaskForPipeline,
} from '~/components/Conforma/conforma-fetch-utils';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useApplications } from '~/hooks/useApplications';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { useNamespace } from '~/shared/providers/Namespace';
import type { PipelineRunKind } from '~/types';
import { useWorkspaceConformaViolations } from '../useWorkspaceConformaViolations';

jest.mock('~/hooks/useApplications', () => ({ useApplications: jest.fn() }));
jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunsV2: jest.fn() }));
jest.mock('~/shared/providers/Namespace', () => ({ useNamespace: jest.fn() }));
jest.mock('~/feature-flags/hooks', () => ({ useIsOnFeatureFlag: jest.fn() }));
jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('~/components/Conforma/conforma-fetch-utils', () => ({
  securityTaskForPipeline: jest.fn(),
  aggregateCounts: jest.requireActual('~/components/Conforma/conforma-fetch-utils').aggregateCounts,
  fetchConformaForPipeline: jest.fn(),
}));

const mockUseApplications = useApplications as jest.Mock;
const mockUsePipelineRunsV2 = usePipelineRunsV2 as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockSecurityTask = securityTaskForPipeline as jest.Mock;
const mockFetchConforma = fetchConformaForPipeline as jest.Mock;

const createPR = (
  name: string,
  appName: string,
  compName: string,
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
        [PipelineRunLabel.APPLICATION]: appName,
        [PipelineRunLabel.COMPONENT]: compName,
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
      },
    },
    spec: {},
    status: {},
  }) as unknown as PipelineRunKind;

const conformaComponents = [
  {
    containerImage: 'quay.io/test/img',
    name: 'comp-a',
    success: false,
    violations: [{ metadata: { title: 'v1', description: '', collections: [], code: 'c1' }, msg: 'v1' }],
    warnings: [],
    successes: [],
  },
];

let queryClient: QueryClient;

const createWrapper = () =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

const flushEffects = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

describe('useWorkspaceConformaViolations', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    mockUseNamespace.mockReturnValue('test-ns');
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    mockUseApplications.mockReturnValue([[], true, undefined]);
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);
    mockSecurityTask.mockReturnValue('verify-conforma');
    mockFetchConforma.mockResolvedValue([]);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('returns loading state while apps are not loaded', () => {
    mockUseApplications.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loaded).toBe(false);
    expect(result.current.applications).toEqual([]);
  });

  it('returns loading state while pipeline runs are not loaded', () => {
    mockUsePipelineRunsV2.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loaded).toBe(false);
  });

  it('surfaces apps error via error field', async () => {
    const appsError = new Error('apps failed');
    mockUseApplications.mockReturnValue([[], true, appsError]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(appsError);
  });

  it('surfaces pipeline runs error via error field', async () => {
    const prsError = new Error('prs failed');
    mockUsePipelineRunsV2.mockReturnValue([[], true, prsError]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(prsError);
  });

  it('returns loaded empty state when there are no pipeline runs', async () => {
    mockUsePipelineRunsV2.mockReturnValue([[], true, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(0);
    expect(result.current.applications).toEqual([]);
  });

  it('returns loaded empty state when no pipeline runs have a security task', async () => {
    mockSecurityTask.mockReturnValue(undefined);
    mockUsePipelineRunsV2.mockReturnValue([
      [createPR('pr-1', 'app-a', 'comp-a')],
      true,
      undefined,
    ]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.applications).toEqual([]);
    expect(mockFetchConforma).not.toHaveBeenCalled();
  });

  it('aggregates violations per application', async () => {
    mockUsePipelineRunsV2.mockReturnValue([
      [createPR('pr-1', 'app-a', 'comp-a')],
      true,
      undefined,
    ]);
    mockFetchConforma.mockResolvedValue(conformaComponents);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(1);
    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0].applicationName).toBe('app-a');
    expect(result.current.applications[0].violationCount).toBe(1);
  });

  it('sums violations across multiple components of the same application', async () => {
    mockUsePipelineRunsV2.mockReturnValue([
      [createPR('pr-1', 'app-a', 'comp-a'), createPR('pr-2', 'app-a', 'comp-b')],
      true,
      undefined,
    ]);
    mockFetchConforma.mockResolvedValue(conformaComponents);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    const appA = result.current.applications.find((a) => a.applicationName === 'app-a');
    expect(appA?.violationCount).toBe(2);
  });

  it('keeps separate per-application summaries for different applications', async () => {
    mockUsePipelineRunsV2.mockReturnValue([
      [createPR('pr-1', 'app-a', 'comp-a'), createPR('pr-2', 'app-b', 'comp-b')],
      true,
      undefined,
    ]);
    mockFetchConforma.mockResolvedValue(conformaComponents);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.applications).toHaveLength(2);
    expect(result.current.totalViolations).toBe(2);
  });

  it('picks only the latest pipeline run per app/component key', async () => {
    const older = createPR('pr-old', 'app-a', 'comp-a', '2025-01-01T00:00:00Z');
    const newer = createPR('pr-new', 'app-a', 'comp-a', '2026-06-01T00:00:00Z');
    mockUsePipelineRunsV2.mockReturnValue([[older, newer], true, undefined]);
    mockFetchConforma.mockResolvedValue(conformaComponents);

    renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(mockFetchConforma).toHaveBeenCalledTimes(1);
    expect(mockFetchConforma).toHaveBeenCalledWith('test-ns', 'pr-new', 'verify-conforma', false);
  });

  it('surfaces all-query failure as error (not partialError)', async () => {
    mockUsePipelineRunsV2.mockReturnValue([
      [createPR('pr-1', 'app-a', 'comp-a')],
      true,
      undefined,
    ]);
    mockFetchConforma.mockRejectedValue(new Error('all failed'));

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(result.current.partialError).toBeUndefined();
  });

  it('surfaces partial failure as partialError (not error) when some queries succeed', async () => {
    mockUsePipelineRunsV2.mockReturnValue([
      [createPR('pr-1', 'app-a', 'comp-a'), createPR('pr-2', 'app-b', 'comp-b')],
      true,
      undefined,
    ]);
    mockFetchConforma
      .mockResolvedValueOnce(conformaComponents)
      .mockRejectedValueOnce(new Error('partial fail'));

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.partialError).toBeTruthy();
    expect(result.current.error).toBeUndefined();
    expect(result.current.applications.length).toBeGreaterThan(0);
  });
});

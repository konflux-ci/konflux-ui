import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-hooks';
import { fetchConformaForComponent } from '~/components/Conforma/conforma-fetch-utils';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useAllComponents } from '~/hooks/useComponents';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ComponentKind } from '~/types';
import { useWorkspaceConformaViolations } from '../useWorkspaceConformaViolations';

jest.mock('~/hooks/useComponents', () => ({ useAllComponents: jest.fn() }));
jest.mock('~/shared/providers/Namespace', () => ({ useNamespace: jest.fn() }));
jest.mock('~/feature-flags/hooks', () => ({ useIsOnFeatureFlag: jest.fn() }));
jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('~/components/Conforma/conforma-fetch-utils', () => ({
  aggregateCounts: jest.requireActual('~/components/Conforma/conforma-fetch-utils').aggregateCounts,
  fetchConformaForComponent: jest.fn(),
}));

const mockUseAllComponents = useAllComponents as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockFetchConforma = fetchConformaForComponent as jest.Mock;

const createComponent = (
  name: string,
  appName: string,
): ComponentKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: {
      name,
      namespace: 'test-ns',
    },
    spec: {
      application: appName,
      componentName: name,
      source: {},
    },
  }) as unknown as ComponentKind;

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
    mockUseAllComponents.mockReturnValue([[], true, undefined]);
    mockFetchConforma.mockResolvedValue([]);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('returns loading state while components are not loaded', () => {
    mockUseAllComponents.mockReturnValue([[], false, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loaded).toBe(false);
    expect(result.current.applications).toEqual([]);
  });

  it('surfaces components error via error field', async () => {
    const compError = new Error('components failed');
    mockUseAllComponents.mockReturnValue([[], true, compError]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(compError);
  });

  it('returns loaded empty state when there are no components', async () => {
    mockUseAllComponents.mockReturnValue([[], true, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations(), {
      wrapper: createWrapper(),
    });

    await flushEffects();

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(0);
    expect(result.current.applications).toEqual([]);
  });

  it('calls fetchConformaForComponent for each component', async () => {
    mockUseAllComponents.mockReturnValue([
      [createComponent('comp-a', 'app-a')],
      true,
      undefined,
    ]);
    mockFetchConforma.mockResolvedValue(conformaComponents);

    renderHook(() => useWorkspaceConformaViolations(), { wrapper: createWrapper() });

    await flushEffects();

    expect(mockFetchConforma).toHaveBeenCalledWith('test-ns', 'comp-a', false);
  });

  it('aggregates violations per application', async () => {
    mockUseAllComponents.mockReturnValue([
      [createComponent('comp-a', 'app-a')],
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
    mockUseAllComponents.mockReturnValue([
      [createComponent('comp-a', 'app-a'), createComponent('comp-b', 'app-a')],
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
    mockUseAllComponents.mockReturnValue([
      [createComponent('comp-a', 'app-a'), createComponent('comp-b', 'app-b')],
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

  it('surfaces all-query failure as error (not partialError)', async () => {
    mockUseAllComponents.mockReturnValue([
      [createComponent('comp-a', 'app-a')],
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
    mockUseAllComponents.mockReturnValue([
      [createComponent('comp-a', 'app-a'), createComponent('comp-b', 'app-b')],
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

import { renderHook } from '@testing-library/react-hooks';
import type {
  ComponentConformaData,
  UseComponentsConformaResultsReturn,
} from '~/components/Conforma/ConformaResultsTab/useComponentsConformaResults';
import { useComponentsConformaResults } from '~/components/Conforma/ConformaResultsTab/useComponentsConformaResults';
import { useAllComponents } from '~/hooks/useComponents';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ComponentKind, TaskRunKind } from '~/types';
import { useWorkspaceConformaViolations } from '../useWorkspaceConformaViolations';

jest.mock('~/hooks/useComponents', () => ({ useAllComponents: jest.fn() }));
jest.mock('~/shared/providers/Namespace', () => ({ useNamespace: jest.fn() }));
jest.mock('~/monitoring/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('~/components/Conforma/ConformaResultsTab/useComponentsConformaResults', () => ({
  useComponentsConformaResults: jest.fn(),
}));

const mockUseAllComponents = useAllComponents as jest.Mock;
const mockUseNamespace = useNamespace as jest.Mock;
const mockUseComponentsConformaResults = useComponentsConformaResults as jest.Mock;

const createComponent = (name: string, appName: string): ComponentKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: { name, namespace: 'test-ns' },
    spec: { application: appName, componentName: name, source: {} },
  }) as unknown as ComponentKind;

const makeConformaData = (violations: number, warnings = 0): ComponentConformaData => ({
  results: [
    {
      containerImage: 'quay.io/test/img',
      name: 'image',
      success: violations === 0,
      violations: Array.from({ length: violations }, (_, i) => ({
        metadata: { title: `v${i}`, description: '', collections: [], code: `c${i}` },
        msg: `v${i}`,
      })),
      warnings: Array.from({ length: warnings }, (_, i) => ({
        metadata: { title: `w${i}`, description: '', collections: [], code: `w${i}` },
        msg: `w${i}`,
      })),
      successes: [],
    },
  ],
  pipelineRunName: 'pr-1',
});

const DEFAULT_SHARED: UseComponentsConformaResultsReturn = {
  conformaByComponent: new Map(),
  mergedLatestPerComponent: new Map<string, TaskRunKind>(),
  taskRunsLoaded: true,
  logsSettled: true,
  fillInSettled: true,
  taskRunsError: undefined,
  aggregatedLogError: undefined,
  refresh: { lastFetchedAt: 0, isRefreshing: false, onRefresh: jest.fn() },
};

describe('useWorkspaceConformaViolations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespace.mockReturnValue('test-ns');
    mockUseAllComponents.mockReturnValue([[], true, undefined]);
    mockUseComponentsConformaResults.mockReturnValue(DEFAULT_SHARED);
  });

  it('returns loading state while components are not loaded', () => {
    mockUseAllComponents.mockReturnValue([[], false, undefined]);
    mockUseComponentsConformaResults.mockReturnValue({ ...DEFAULT_SHARED, taskRunsLoaded: false });

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(false);
    expect(result.current.applications).toEqual([]);
  });

  it('returns loading state while TaskRuns are not loaded', () => {
    mockUseComponentsConformaResults.mockReturnValue({ ...DEFAULT_SHARED, taskRunsLoaded: false });

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(false);
  });

  it('surfaces components error via error field', () => {
    const compError = new Error('components failed');
    mockUseAllComponents.mockReturnValue([[], true, compError]);

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(true);
    expect(result.current.error).toBe(compError);
  });

  it('returns loaded empty state when there are no components', () => {
    mockUseAllComponents.mockReturnValue([[], true, undefined]);

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(0);
    expect(result.current.applications).toEqual([]);
  });

  it('aggregates violations per application using conformaByComponent', () => {
    const comp = createComponent('comp-a', 'app-a');
    mockUseAllComponents.mockReturnValue([[comp], true, undefined]);
    mockUseComponentsConformaResults.mockReturnValue({
      ...DEFAULT_SHARED,
      conformaByComponent: new Map([['comp-a', makeConformaData(1)]]),
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(1);
    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0].applicationName).toBe('app-a');
    expect(result.current.applications[0].violationCount).toBe(1);
  });

  it('sums violations across multiple components of the same application', () => {
    const comps = [createComponent('comp-a', 'app-a'), createComponent('comp-b', 'app-a')];
    mockUseAllComponents.mockReturnValue([comps, true, undefined]);
    mockUseComponentsConformaResults.mockReturnValue({
      ...DEFAULT_SHARED,
      conformaByComponent: new Map([
        ['comp-a', makeConformaData(1)],
        ['comp-b', makeConformaData(2)],
      ]),
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    const appA = result.current.applications.find((a) => a.applicationName === 'app-a');
    expect(appA?.violationCount).toBe(3);
    expect(result.current.totalViolations).toBe(3);
  });

  it('keeps separate per-application summaries for different applications', () => {
    const comps = [createComponent('comp-a', 'app-a'), createComponent('comp-b', 'app-b')];
    mockUseAllComponents.mockReturnValue([comps, true, undefined]);
    mockUseComponentsConformaResults.mockReturnValue({
      ...DEFAULT_SHARED,
      conformaByComponent: new Map([
        ['comp-a', makeConformaData(1)],
        ['comp-b', makeConformaData(1)],
      ]),
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.applications).toHaveLength(2);
    expect(result.current.totalViolations).toBe(2);
  });

  it('surfaces aggregatedLogError as partialError', () => {
    const comp = createComponent('comp-a', 'app-a');
    mockUseAllComponents.mockReturnValue([[comp], true, undefined]);
    mockUseComponentsConformaResults.mockReturnValue({
      ...DEFAULT_SHARED,
      aggregatedLogError: new Error('log fetch failed'),
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(true);
    expect(result.current.partialError).toBeTruthy();
  });

  it('passes no applicationName to useComponentsConformaResults for workspace-wide scope', () => {
    mockUseAllComponents.mockReturnValue([[], true, undefined]);

    renderHook(() => useWorkspaceConformaViolations());

    // Shared hook must be called without applicationName options
    expect(mockUseComponentsConformaResults).toHaveBeenCalledWith('test-ns', []);
  });

  it('ignores components without conformaByComponent data', () => {
    const comp = createComponent('comp-a', 'app-a');
    mockUseAllComponents.mockReturnValue([[comp], true, undefined]);
    mockUseComponentsConformaResults.mockReturnValue({
      ...DEFAULT_SHARED,
      conformaByComponent: new Map(), // no data for comp-a
    });

    const { result } = renderHook(() => useWorkspaceConformaViolations());

    expect(result.current.loaded).toBe(true);
    expect(result.current.totalViolations).toBe(0);
    expect(result.current.applications).toHaveLength(0);
  });
});

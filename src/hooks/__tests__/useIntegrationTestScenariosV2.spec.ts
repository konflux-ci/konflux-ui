import { renderHook } from '@testing-library/react';
import { IntegrationTestScenarioGroupVersionKind, IntegrationTestScenarioModel } from '~/models';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import {
  useIntegrationTestScenarioV2,
  useIntegrationTestScenariosV2,
} from '../useIntegrationTestScenariosV2';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

const createMockScenario = (
  name: string,
  componentGroup: string,
  overrides: Partial<IntegrationTestScenarioKind> = {},
): IntegrationTestScenarioKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1beta2',
    kind: 'IntegrationTestScenario',
    metadata: {
      name,
      namespace: 'test-ns',
      uid: `uid-${name}`,
    },
    spec: {
      application: 'test-app',
      componentGroup,
      resolverRef: {
        resolver: 'git',
        resourceKind: 'pipeline',
        params: [
          { name: 'url', value: 'https://github.com/example/repo' },
          { name: 'revision', value: 'main' },
          { name: 'pathInRepo', value: 'pipelines/test.yaml' },
        ],
      },
    },
    ...overrides,
  }) as unknown as IntegrationTestScenarioKind;

const mockScenarioA = createMockScenario('test-a', 'group-1');
const mockScenarioB = createMockScenario('test-b', 'group-1');
const mockScenarioOtherGroup = createMockScenario('test-other', 'group-2');

describe('useIntegrationTestScenariosV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([
      [mockScenarioA, mockScenarioB, mockScenarioOtherGroup],
      true,
      undefined,
    ]);
  });

  it('should return only scenarios for the given group when loaded', () => {
    const { result } = renderHook(() => useIntegrationTestScenariosV2('test-ns', 'group-1'));

    const [tests, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(tests).toHaveLength(2);
    expect(tests).toEqual([mockScenarioA, mockScenarioB]);
  });

  it('should return an empty array when no scenarios match the group', () => {
    const { result } = renderHook(() => useIntegrationTestScenariosV2('test-ns', 'unknown-group'));

    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true);
  });

  it('should return an empty array while the request is in flight', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useIntegrationTestScenariosV2('test-ns', 'group-1'));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return an empty array when the watch fails', () => {
    const mockError = new Error('API error');
    useK8sWatchResourceMock.mockReturnValue([[], true, mockError]);

    const { result } = renderHook(() => useIntegrationTestScenariosV2('test-ns', 'group-1'));

    expect(result.current).toEqual([[], true, mockError]);
  });

  it('should watch the scenario list in the given namespace', () => {
    renderHook(() => useIntegrationTestScenariosV2('test-ns', 'group-1'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: IntegrationTestScenarioGroupVersionKind,
        namespace: 'test-ns',
        isList: true,
      },
      IntegrationTestScenarioModel,
      { filterData: expect.any(Function) },
    );
  });

  it('should filter out scenarios that are being deleted before caching', () => {
    renderHook(() => useIntegrationTestScenariosV2('test-ns', 'group-1'));

    const queryOptions = useK8sWatchResourceMock.mock.calls[0][2];
    const filtered = queryOptions.filterData([
      mockScenarioA,
      {
        ...mockScenarioB,
        metadata: {
          ...mockScenarioB.metadata,
          name: 'deleting-test',
          deletionTimestamp: '2026-08-22T00:00:00Z',
        },
      } as IntegrationTestScenarioKind,
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].metadata.name).toBe('test-a');
  });
});

describe('useIntegrationTestScenarioV2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([mockScenarioA, true, undefined]);
  });

  it('should return the scenario when the group matches', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenarioV2('test-ns', 'group-1', 'test-a'),
    );

    const [test, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(test).toEqual(mockScenarioA);
  });

  it('should return a 404 when the scenario belongs to a different group', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenarioV2('test-ns', 'group-2', 'test-a'),
    );

    expect(result.current).toEqual([null, true, { code: 404 }]);
  });

  it('should return a 404 when the scenario is being deleted', () => {
    useK8sWatchResourceMock.mockReturnValue([
      {
        ...mockScenarioA,
        metadata: { ...mockScenarioA.metadata, deletionTimestamp: '2026-08-22T00:00:00Z' },
      },
      true,
      undefined,
    ]);

    const { result } = renderHook(() =>
      useIntegrationTestScenarioV2('test-ns', 'group-1', 'test-a'),
    );

    expect(result.current).toEqual([null, true, { code: 404 }]);
  });

  it('should return null while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenarioV2('test-ns', 'group-1', 'test-a'),
    );

    expect(result.current).toEqual([null, false, undefined]);
  });

  it('should pass through watch errors', () => {
    const mockError = { code: 403, message: 'Forbidden' };
    useK8sWatchResourceMock.mockReturnValue([null, true, mockError]);

    const { result } = renderHook(() =>
      useIntegrationTestScenarioV2('test-ns', 'group-1', 'test-a'),
    );

    expect(result.current).toEqual([null, true, mockError]);
  });

  it('should watch the named scenario in the given namespace', () => {
    renderHook(() => useIntegrationTestScenarioV2('test-ns', 'group-1', 'test-a'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: IntegrationTestScenarioGroupVersionKind,
        name: 'test-a',
        namespace: 'test-ns',
      },
      IntegrationTestScenarioModel,
    );
  });
});

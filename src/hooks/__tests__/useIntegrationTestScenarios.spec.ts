import { renderHook } from '@testing-library/react-hooks';
import { IntegrationTestScenarioGroupVersionKind, IntegrationTestScenarioModel } from '~/models';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import { MockIntegrationTestsWithGit } from '../../components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import {
  useIntegrationTestScenario,
  useIntegrationTestScenarioForContext,
  useIntegrationTestScenarios,
  useIntegrationTestScenariosByComponentGroup,
} from '../useIntegrationTestScenarios';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useIntegrationTestScenario', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the integration test when data is loaded', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: MockIntegrationTestsWithGit[0],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenario('test-namespace', 'test-app', 'test-app-test-1'),
    );
    const [integrationTest, loaded, error] = result.current;

    expect(integrationTest).toEqual(MockIntegrationTestsWithGit[0]);
    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
  });

  it('should return null and loading state while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenario('test-namespace', 'test-app', 'test-app-test-1'),
    );
    const [integrationTest, loaded, error] = result.current;

    expect(integrationTest).toBeNull();
    expect(loaded).toBe(false);
    expect(error).toBeUndefined();
  });

  it('should return 404 when resource data is undefined', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenario('test-namespace', 'test-app', 'test-app-test-1'),
    );
    const [integrationTest, loaded, error] = result.current;

    expect(integrationTest).toBeNull();
    expect(loaded).toBe(true);
    expect(error).toEqual({ code: 404 });
  });

  it('should return 404 when application name does not match', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: MockIntegrationTestsWithGit[0],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenario('test-namespace', 'other-app', 'test-app-test-1'),
    );
    const [integrationTest, loaded, error] = result.current;

    expect(integrationTest).toBeNull();
    expect(loaded).toBe(true);
    expect(error).toEqual({ code: 404 });
  });

  it('should return 404 when resource has deletionTimestamp', () => {
    const deletedTest = {
      ...MockIntegrationTestsWithGit[0],
      metadata: {
        ...MockIntegrationTestsWithGit[0].metadata,
        deletionTimestamp: '2024-01-01T00:00:00Z',
      },
    };
    useK8sWatchResourceMock.mockReturnValue({
      data: deletedTest,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenario('test-namespace', 'test-app', 'test-app-test-1'),
    );
    const [integrationTest, loaded, error] = result.current;

    expect(integrationTest).toBeNull();
    expect(loaded).toBe(true);
    expect(error).toEqual({ code: 404 });
  });

  it('should return error when fetch fails', () => {
    const mockError = { code: 500, message: 'Internal server error' };
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenario('test-namespace', 'test-app', 'test-app-test-1'),
    );
    const [integrationTest, loaded, error] = result.current;

    expect(integrationTest).toBeNull();
    expect(loaded).toBe(true);
    expect(error).toEqual(mockError);
  });
});

describe('useIntegrationTestScenarios', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return filtered integration tests for the given application', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: MockIntegrationTestsWithGit,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useIntegrationTestScenarios('test-namespace', 'test-app'));
    const [integrationTests, loaded, error] = result.current;

    expect(integrationTests).toHaveLength(3);
    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
  });

  it('should return empty array while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useIntegrationTestScenarios('test-namespace', 'test-app'));
    const [integrationTests, loaded] = result.current;

    expect(integrationTests).toEqual([]);
    expect(loaded).toBe(false);
  });
});

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

describe('useIntegrationTestScenariosByComponentGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Group filtering happens in the hook (useMemo); filterData only
    // filters out resources being deleted.
    useK8sWatchResourceMock.mockReturnValue([[mockScenarioA, mockScenarioB], true, undefined]);
  });

  it('should return scenarios for the given group when loaded', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenariosByComponentGroup('test-ns', 'group-1'),
    );

    const [tests, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(tests).toHaveLength(2);
    expect(tests).toEqual([mockScenarioA, mockScenarioB]);
  });

  it('should return an empty array when no scenarios match the group', () => {
    // Query layer filters out all scenarios for an unknown group.
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);

    const { result } = renderHook(() =>
      useIntegrationTestScenariosByComponentGroup('test-ns', 'unknown-group'),
    );

    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(true);
  });

  it('should return an empty array while the request is in flight', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useIntegrationTestScenariosByComponentGroup('test-ns', 'group-1'),
    );

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return an empty array when the watch fails', () => {
    const mockError = new Error('API error');
    useK8sWatchResourceMock.mockReturnValue([[], true, mockError]);

    const { result } = renderHook(() =>
      useIntegrationTestScenariosByComponentGroup('test-ns', 'group-1'),
    );

    expect(result.current).toEqual([[], true, mockError]);
  });

  it('should watch the scenario list in the given namespace', () => {
    renderHook(() => useIntegrationTestScenariosByComponentGroup('test-ns', 'group-1'));

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
    renderHook(() => useIntegrationTestScenariosByComponentGroup('test-ns', 'group-1'));

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

  it('should filter out scenarios from other groups in the hook result', () => {
    // Group filtering happens in the hook (useMemo), not in filterData,
    // so the watch layer still sees scenarios from all groups.
    useK8sWatchResourceMock.mockReturnValue([
      [mockScenarioA, mockScenarioB, mockScenarioOtherGroup],
      true,
      undefined,
    ]);

    const { result } = renderHook(() =>
      useIntegrationTestScenariosByComponentGroup('test-ns', 'group-1'),
    );

    expect(result.current[0]).toHaveLength(2);
    expect(result.current[0]).toEqual([mockScenarioA, mockScenarioB]);
  });

  it('should return an empty array when no scenarios match the group in the hook result', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [mockScenarioA, mockScenarioB, mockScenarioOtherGroup],
      true,
      undefined,
    ]);

    const { result } = renderHook(() =>
      useIntegrationTestScenariosByComponentGroup('test-ns', 'unknown-group'),
    );

    expect(result.current[0]).toEqual([]);
  });
});

describe('useIntegrationTestScenarioForContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([mockScenarioA, true, undefined]);
  });

  it('should return the scenario when the application matches', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { applicationName: 'test-app' }),
    );

    const [test, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(test).toEqual(mockScenarioA);
  });

  it('should return the scenario when the group matches', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { groupName: 'group-1' }),
    );

    const [test, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(test).toEqual(mockScenarioA);
  });

  it('should prefer the group match when both application and group are passed', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenarioForContext('test-ns', 'test-a', {
        applicationName: 'other-app',
        groupName: 'group-1',
      }),
    );

    expect(result.current[0]).toEqual(mockScenarioA);
  });

  it('should return a 404 when the scenario belongs to a different application', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { applicationName: 'other-app' }),
    );

    expect(result.current).toEqual([null, true, { code: 404 }]);
  });

  it('should return a 404 when the scenario belongs to a different group', () => {
    const { result } = renderHook(() =>
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { groupName: 'group-2' }),
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
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { groupName: 'group-1' }),
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
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { groupName: 'group-1' }),
    );

    expect(result.current).toEqual([null, false, undefined]);
  });

  it('should pass through watch errors', () => {
    const mockError = { code: 403, message: 'Forbidden' };
    useK8sWatchResourceMock.mockReturnValue([null, true, mockError]);

    const { result } = renderHook(() =>
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { groupName: 'group-1' }),
    );

    expect(result.current).toEqual([null, true, mockError]);
  });

  it('should watch the named scenario in the given namespace', () => {
    renderHook(() =>
      useIntegrationTestScenarioForContext('test-ns', 'test-a', { groupName: 'group-1' }),
    );

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

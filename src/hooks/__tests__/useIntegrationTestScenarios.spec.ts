import { renderHook } from '@testing-library/react-hooks';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import { MockIntegrationTestsWithGit } from '../../components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import {
  useIntegrationTestScenario,
  useIntegrationTestScenarios,
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

    const { result } = renderHook(() =>
      useIntegrationTestScenarios('test-namespace', 'test-app'),
    );
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

    const { result } = renderHook(() =>
      useIntegrationTestScenarios('test-namespace', 'test-app'),
    );
    const [integrationTests, loaded] = result.current;

    expect(integrationTests).toEqual([]);
    expect(loaded).toBe(false);
  });
});

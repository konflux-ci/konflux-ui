import { renderHook } from '@testing-library/react-hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { useApplicationReleases } from '../useApplicationReleases';

// Create mocks
const mockUseNamespace = mockUseNamespaceHook('test-namespace');
const mockUseReleases = jest.fn();

jest.mock('../useReleases', () => ({
  useReleases: (...args: unknown[]) => mockUseReleases(...args),
}));

const mockReleasesResult = (overrides = {}) => ({
  data: [{ metadata: { name: 'release-1' } }, { metadata: { name: 'release-2' } }],
  isLoading: false,
  archiveError: undefined,
  clusterError: undefined,
  ...overrides,
});

describe('useApplicationReleases', () => {
  const mockReleases = [{ metadata: { name: 'release-1' } }, { metadata: { name: 'release-2' } }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return releases, loading state, and error from useReleases', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockReleasesResult());

    const { result } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(mockUseNamespace).toHaveBeenCalledTimes(1);
    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, {
      [PipelineRunLabel.APPLICATION]: mockApplicationName,
    });
    expect(result.current).toEqual([mockReleases, true, undefined]);
  });

  it('should handle loading state', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockReleasesResult({ data: [], isLoading: true }));

    const { result } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should handle error state', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';
    const mockError = new Error('Failed to fetch releases');

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(
      mockReleasesResult({ data: [], isLoading: false, clusterError: mockError }),
    );

    const { result } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(result.current).toEqual([[], true, mockError]);
  });

  it('should prefer archive error over cluster error', () => {
    const mockArchiveError = new Error('Archive error');
    const mockClusterError = new Error('Cluster error');

    mockUseNamespace.mockReturnValue('test-namespace');
    mockUseReleases.mockReturnValue(
      mockReleasesResult({
        data: [],
        isLoading: false,
        archiveError: mockArchiveError,
        clusterError: mockClusterError,
      }),
    );

    const { result } = renderHook(() => useApplicationReleases('test-app'));

    expect(result.current).toEqual([[], true, mockArchiveError]);
  });

  it('should re-fetch when application name changes', () => {
    const mockNamespace = 'test-namespace';
    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockReleasesResult());

    const { rerender } = renderHook(
      ({ applicationName }) => useApplicationReleases(applicationName),
      { initialProps: { applicationName: 'app-1' } },
    );

    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, {
      [PipelineRunLabel.APPLICATION]: 'app-1',
    });

    rerender({ applicationName: 'app-2' });

    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, {
      [PipelineRunLabel.APPLICATION]: 'app-2',
    });
    expect(mockUseReleases).toHaveBeenCalledTimes(2);
  });

  it('should re-fetch when namespace changes', () => {
    const mockApplicationName = 'test-app';
    mockUseReleases.mockReturnValue(mockReleasesResult());

    mockUseNamespace.mockReturnValue('namespace-1');
    const { rerender } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(mockUseReleases).toHaveBeenCalledWith('namespace-1', {
      [PipelineRunLabel.APPLICATION]: mockApplicationName,
    });

    mockUseNamespace.mockReturnValue('namespace-2');
    rerender();

    expect(mockUseReleases).toHaveBeenCalledWith('namespace-2', {
      [PipelineRunLabel.APPLICATION]: mockApplicationName,
    });
    expect(mockUseReleases).toHaveBeenCalledTimes(2);
  });

  it('should handle empty application name', () => {
    const mockNamespace = 'test-namespace';
    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockReleasesResult({ data: [] }));

    const { result } = renderHook(() => useApplicationReleases(''));

    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, undefined);
    expect(result.current).toEqual([[], true, undefined]);
  });

  it('should return equal values when data does not change', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockReleasesResult());

    const { result, rerender } = renderHook(() => useApplicationReleases(mockApplicationName));
    const firstResult = result.current;

    rerender();
    const secondResult = result.current;

    expect(secondResult).toEqual(firstResult);
  });
});

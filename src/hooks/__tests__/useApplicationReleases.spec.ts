import { renderHook } from '@testing-library/react-hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils';
import { useApplicationReleases } from '../useApplicationReleases';

// Create mocks
const mockUseNamespace = mockUseNamespaceHook('test-namespace');
const mockUseReleases = jest.fn();

jest.mock('../useReleases', () => ({
  useReleases: (...args: unknown[]) => mockUseReleases(...args),
}));

describe('useApplicationReleases', () => {
  const mockReleases = [{ metadata: { name: 'release-1' } }, { metadata: { name: 'release-2' } }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return releases, loading state, and error from useReleases', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';
    const mockData = [mockReleases, true, undefined];

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockData);

    const { result } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(mockUseNamespace).toHaveBeenCalledTimes(1);
    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, mockApplicationName);
    expect(result.current).toEqual(mockData);
  });

  it('should handle loading state', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';
    const mockData = [[], false, undefined];

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockData);

    const { result } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should handle error state', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';
    const mockError = new Error('Failed to fetch releases');
    const mockData = [[], true, mockError];

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(mockData);

    const { result } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(result.current).toEqual([[], true, mockError]);
  });

  it('should re-fetch when application name changes', () => {
    const mockNamespace = 'test-namespace';
    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue([mockReleases, true, undefined]);

    const { rerender } = renderHook(
      ({ applicationName }) => useApplicationReleases(applicationName),
      { initialProps: { applicationName: 'app-1' } },
    );

    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, 'app-1');

    rerender({ applicationName: 'app-2' });

    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, 'app-2');
    expect(mockUseReleases).toHaveBeenCalledTimes(2);
  });

  it('should re-fetch when namespace changes', () => {
    const mockApplicationName = 'test-app';
    mockUseReleases.mockReturnValue([mockReleases, true, undefined]);

    mockUseNamespace.mockReturnValue('namespace-1');
    const { rerender } = renderHook(() => useApplicationReleases(mockApplicationName));

    expect(mockUseReleases).toHaveBeenCalledWith('namespace-1', mockApplicationName);

    mockUseNamespace.mockReturnValue('namespace-2');
    rerender();

    expect(mockUseReleases).toHaveBeenCalledWith('namespace-2', mockApplicationName);
    expect(mockUseReleases).toHaveBeenCalledTimes(2);
  });

  it('should handle empty application name', () => {
    const mockNamespace = 'test-namespace';
    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue([[], true, undefined]);

    const { result } = renderHook(() => useApplicationReleases(''));

    expect(mockUseReleases).toHaveBeenCalledWith(mockNamespace, '');
    expect(result.current).toEqual([[], true, undefined]);
  });

  it('should maintain referential stability when data does not change', () => {
    const mockNamespace = 'test-namespace';
    const mockApplicationName = 'test-app';
    const stableData = [mockReleases, true, undefined];

    mockUseNamespace.mockReturnValue(mockNamespace);
    mockUseReleases.mockReturnValue(stableData);

    const { result, rerender } = renderHook(() => useApplicationReleases(mockApplicationName));
    const firstResult = result.current;

    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});

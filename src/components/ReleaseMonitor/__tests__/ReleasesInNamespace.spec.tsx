import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import ReleasesInNamespace from '../ReleasesInNamespace';

jest.mock('~/hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));

const mockUseK8sAndKarchResources = useK8sAndKarchResources as jest.Mock;

describe('ReleasesInNamespace', () => {
  const mockOnReleasesLoaded = jest.fn();
  const mockOnError = jest.fn();
  const namespace = 'test-ns';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call onReleasesLoaded when data is loaded successfully', () => {
    const mockData = [{ metadata: { name: 'release-1' } }];
    mockUseK8sAndKarchResources.mockReturnValue({
      data: mockData,
      isLoading: false,
      clusterError: null,
      archiveError: null,
    });

    renderWithQueryClientAndRouter(
      <ReleasesInNamespace
        namespace={namespace}
        onReleasesLoaded={mockOnReleasesLoaded}
        onError={mockOnError}
      />,
    );

    expect(mockOnReleasesLoaded).toHaveBeenCalledWith(namespace, mockData);
    expect(mockOnReleasesLoaded).toHaveBeenCalledTimes(1);
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should call onError when both cluster and archive return errors', () => {
    const error = new Error('Failed to fetch');
    mockUseK8sAndKarchResources.mockReturnValue({
      data: null,
      isLoading: false,
      clusterError: error,
      archiveError: error,
    });

    renderWithQueryClientAndRouter(
      <ReleasesInNamespace
        namespace={namespace}
        onReleasesLoaded={mockOnReleasesLoaded}
        onError={mockOnError}
      />,
    );

    expect(mockOnError).toHaveBeenCalledWith(error);
    expect(mockOnReleasesLoaded).not.toHaveBeenCalled();
  });

  it('should not call callbacks while loading', () => {
    mockUseK8sAndKarchResources.mockReturnValue({
      data: null,
      isLoading: true,
      clusterError: null,
      archiveError: null,
    });

    renderWithQueryClientAndRouter(
      <ReleasesInNamespace
        namespace={namespace}
        onReleasesLoaded={mockOnReleasesLoaded}
        onError={mockOnError}
      />,
    );

    expect(mockOnReleasesLoaded).not.toHaveBeenCalled();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('should call onReleasesLoaded again if data changes', () => {
    const mockData1 = [{ metadata: { name: 'release-1' } }];
    const mockData2 = [{ metadata: { name: 'release-1' } }, { metadata: { name: 'release-2' } }];

    mockUseK8sAndKarchResources.mockReturnValue({
      data: mockData1,
      isLoading: false,
      clusterError: null,
      archiveError: null,
    });

    const { rerender } = renderWithQueryClientAndRouter(
      <ReleasesInNamespace
        namespace={namespace}
        onReleasesLoaded={mockOnReleasesLoaded}
        onError={mockOnError}
      />,
    );

    expect(mockOnReleasesLoaded).toHaveBeenCalledWith(namespace, mockData1);

    mockUseK8sAndKarchResources.mockReturnValue({
      data: mockData2,
      isLoading: false,
      clusterError: null,
      archiveError: null,
    });

    rerender(
      <ReleasesInNamespace
        namespace={namespace}
        onReleasesLoaded={mockOnReleasesLoaded}
        onError={mockOnError}
      />,
    );

    expect(mockOnReleasesLoaded).toHaveBeenCalledWith(namespace, mockData2);
    expect(mockOnReleasesLoaded).toHaveBeenCalledTimes(2);
  });
});

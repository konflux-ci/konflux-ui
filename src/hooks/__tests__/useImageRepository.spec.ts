import { renderHook } from '@testing-library/react-hooks';
import { createK8sWatchResourceMock } from '~/utils/test-utils';
import { useImageRepository } from '../useImageRepository';
// eslint-disable-next-line import/order
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useImageRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when call is inflight', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toBeUndefined();
    expect(loaded).toBe(false);
    expect(error).toBeUndefined();
  });

  it('should return image repository when loaded', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockPublicImageRepository,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toEqual(mockPublicImageRepository);
    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
  });

  it('should return error when request fails', () => {
    const mockError = { code: 500, message: 'Internal server error' };
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toBeUndefined();
    expect(loaded).toBe(true);
    expect(error).toEqual(mockError);
  });

  it('should return 404 error when image repository is being deleted', () => {
    const deletingImageRepository = {
      ...mockPublicImageRepository,
      metadata: {
        ...mockPublicImageRepository.data,
        deletionTimestamp: '2024-01-01T00:00:00Z',
      },
    };

    useK8sWatchResourceMock.mockReturnValue({
      data: deletingImageRepository,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toBeNull();
    expect(loaded).toBe(true);
    expect(error).toEqual({ code: 404 });
  });

  it('should return undefined resource when componentName is not provided', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', '', false));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toBeUndefined();
    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
  });

  it('should pass watch parameter correctly', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockPublicImageRepository,
      isLoading: false,
      error: undefined,
    });

    renderHook(() => useImageRepository('test-ns', 'test-component', true));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        watch: true,
      }),
      expect.any(Object),
    );
  });

  it('should handle private image repository', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockPrivateImageRepository,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toEqual(mockPrivateImageRepository);
    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
  });
});

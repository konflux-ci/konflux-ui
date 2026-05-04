import { renderHook } from '@testing-library/react-hooks';
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';
import { ImageRepositoryLabel } from '~/consts/imagerepo';
import { ImageRepositoryKind } from '~/types';
import { createK8sWatchResourceMock } from '~/utils/test-utils';
import { useImageRepository } from '../useImageRepository';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useImageRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return null while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toBeNull();
    expect(loaded).toBe(false);
    expect(error).toBeNull();
  });

  it('should fetch with label selector and isList', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [mockPublicImageRepository],
      isLoading: false,
      error: undefined,
    });

    renderHook(() => useImageRepository('test-ns', 'test-component', undefined, true));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isList: true,
        watch: true,
        namespace: 'test-ns',
        selector: {
          matchLabels: {
            [ImageRepositoryLabel.COMPONENT]: 'test-component',
          },
        },
      }),
      expect.any(Object),
    );
  });

  it('should fetch with application label when applicationName is provided', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [mockPublicImageRepository],
      isLoading: false,
      error: undefined,
    });

    renderHook(() => useImageRepository('test-ns', 'test-component', 'test-app'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isList: true,
        namespace: 'test-ns',
        selector: {
          matchLabels: {
            [ImageRepositoryLabel.APPLICATION]: 'test-app',
          },
        },
      }),
      expect.any(Object),
    );
  });

  it('should return image repository matching component ownerReference', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [mockPublicImageRepository],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toEqual(mockPublicImageRepository);
    expect(loaded).toBe(true);
    expect(error).toBeNull();
  });

  it('should return private image repository matching component ownerReference', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [mockPrivateImageRepository],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toEqual(mockPrivateImageRepository);
    expect(loaded).toBe(true);
    expect(error).toBeNull();
  });

  it('should return null when no ownerReference matches the component', () => {
    const repoWithDifferentOwner: ImageRepositoryKind = {
      ...mockPublicImageRepository,
      metadata: {
        ...mockPublicImageRepository.metadata,
        ownerReferences: [
          {
            apiVersion: 'appstudio.redhat.com/v1alpha1',
            kind: 'Component',
            name: 'other-component',
            uid: 'other-uid',
          },
        ],
      },
    };

    useK8sWatchResourceMock.mockReturnValue({
      data: [repoWithDifferentOwner],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded] = result.current;

    expect(imageRepository).toBeNull();
    expect(loaded).toBe(true);
  });

  it('should return first match when multiple repos have matching ownerReference', () => {
    const secondRepo: ImageRepositoryKind = {
      ...mockPublicImageRepository,
      metadata: {
        ...mockPublicImageRepository.metadata,
        name: 'second-repo',
      },
    };

    useK8sWatchResourceMock.mockReturnValue({
      data: [mockPublicImageRepository, secondRepo],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toEqual(mockPublicImageRepository);
    expect(loaded).toBe(true);
    expect(error).toBeNull();
  });

  it('should handle repos without ownerReferences gracefully', () => {
    const repoWithoutOwnerRef: ImageRepositoryKind = {
      ...mockPublicImageRepository,
      metadata: {
        name: 'no-owner-repo',
        namespace: 'test-ns',
      },
    };

    useK8sWatchResourceMock.mockReturnValue({
      data: [repoWithoutOwnerRef],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded] = result.current;

    expect(imageRepository).toBeNull();
    expect(loaded).toBe(true);
  });

  it('should return error when fetch fails', () => {
    const mockError = { code: 500, message: 'Internal server error' };

    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded, error] = result.current;

    expect(imageRepository).toBeNull();
    expect(loaded).toBe(true);
    expect(error).toEqual(mockError);
  });

  it('should return null when empty list is returned', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useImageRepository('test-ns', 'test-component'));
    const [imageRepository, loaded] = result.current;

    expect(imageRepository).toBeNull();
    expect(loaded).toBe(true);
  });

  describe('Edge cases', () => {
    it('should not fetch when componentName is not provided', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useImageRepository('test-ns', null));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(true);
      expect(error).toBeUndefined();
    });

    it('should not fetch when namespace is not provided', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useImageRepository(null, 'test-component'));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(true);
      expect(error).toBeUndefined();
    });

    it('should not fetch when componentName is empty string', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useImageRepository('test-ns', ''));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(true);
      expect(error).toBeUndefined();
    });
  });
});

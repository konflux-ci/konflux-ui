import { renderHook } from '@testing-library/react-hooks';
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';
import { ImageRepositoryLabel } from '~/consts/imagerepo';
import { createK8sWatchResourceMock } from '~/utils/test-utils';
import { useImageRepository } from '../useImageRepository';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useImageRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Primary fetch (by name)', () => {
    it('should return null when primary call is inflight', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: undefined,
      });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(false);
      expect(error).toBeNull();
    });

    it('should return image repository when primary fetch succeeds', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: mockPublicImageRepository,
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toEqual(mockPublicImageRepository);
      expect(loaded).toBe(true);
      expect(error).toBeNull();
    });

    it('should handle private image repository from primary fetch', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: mockPrivateImageRepository,
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toEqual(mockPrivateImageRepository);
      expect(loaded).toBe(true);
      expect(error).toBeNull();
    });

    it('should pass watch parameter correctly to primary fetch', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: mockPublicImageRepository,
        isLoading: false,
        error: undefined,
      });

      renderHook(() => useImageRepository('test-ns', 'test-component', true));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          watch: true,
          name: 'test-component',
          namespace: 'test-ns',
        }),
        expect.any(Object),
      );
    });
  });

  describe('Fetch by label', () => {
    it('should fallback to label selector when primary fetch fails', () => {
      const mockError = { code: 404, message: 'Not found' };

      // First call (primary) returns error
      // Second call (fallback) returns success
      useK8sWatchResourceMock
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
          error: mockError,
        })
        .mockReturnValueOnce({
          data: [mockPublicImageRepository],
          isLoading: false,
          error: undefined,
        });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toEqual(mockPublicImageRepository);
      expect(loaded).toBe(true);
      expect(error).toBeNull();

      // Verify fallback was called with label selector
      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isList: true,
          selector: {
            matchLabels: {
              [ImageRepositoryLabel.COMPONENT]: 'test-component',
            },
          },
        }),
        expect.any(Object),
      );
    });

    it('should return null when fallback is still loading', () => {
      const mockError = { code: 404, message: 'Not found' };

      useK8sWatchResourceMock
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
          error: mockError,
        })
        .mockReturnValueOnce({
          data: undefined,
          isLoading: true,
          error: undefined,
        });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(false);
      expect(error).toBeNull();
    });

    it('should return first repository when fallback returns multiple', () => {
      const mockError = { code: 404, message: 'Not found' };
      const anotherImageRepo = { ...mockPublicImageRepository, metadata: { name: 'another-repo' } };

      useK8sWatchResourceMock
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
          error: mockError,
        })
        .mockReturnValueOnce({
          data: [mockPublicImageRepository, anotherImageRepo],
          isLoading: false,
          error: undefined,
        });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toEqual(mockPublicImageRepository);
      expect(loaded).toBe(true);
      expect(error).toBeNull();
    });

    it('should return primary error when both primary and fallback fail', () => {
      const primaryError = { code: 404, message: 'Not found' };
      const fallbackError = { code: 500, message: 'Internal server error' };

      useK8sWatchResourceMock
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
          error: primaryError,
        })
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
          error: fallbackError,
        });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(true);
      // Returns primary error since it happens first
      expect(error).toEqual(primaryError);
    });

    it('should return primary error when fallback returns empty array', () => {
      const primaryError = { code: 404, message: 'Not found' };

      useK8sWatchResourceMock
        .mockReturnValueOnce({
          data: undefined,
          isLoading: false,
          error: primaryError,
        })
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: undefined,
        });

      const { result } = renderHook(() => useImageRepository('test-ns', 'test-component', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(true);
      expect(error).toEqual(primaryError);
    });
  });

  describe('Edge cases', () => {
    it('should not fetch when componentName is not provided', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useImageRepository('test-ns', null, false));
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

      const { result } = renderHook(() => useImageRepository(null, 'test-component', false));
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

      const { result } = renderHook(() => useImageRepository('test-ns', '', false));
      const [imageRepository, loaded, error] = result.current;

      expect(imageRepository).toBeNull();
      expect(loaded).toBe(true);
      expect(error).toBeUndefined();
    });
  });
});

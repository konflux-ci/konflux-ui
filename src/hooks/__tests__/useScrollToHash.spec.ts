import { renderHook } from '@testing-library/react-hooks';
import { createReactRouterMock } from '~/unit-test-utils';
import { useScrollToHash } from '../useScrollToHash';

const useLocationMock = createReactRouterMock('useLocation');

describe('useScrollToHash', () => {
  let mockScrollIntoView: jest.Mock;
  let mockGetElementById: jest.Mock;
  let mockSetTimeout: jest.SpyInstance;
  let mockClearTimeout: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockScrollIntoView = jest.fn();
    mockGetElementById = jest.fn();

    // Mock document.getElementById
    Object.defineProperty(document, 'getElementById', {
      writable: true,
      value: mockGetElementById,
    });

    // Mock setTimeout and clearTimeout
    mockSetTimeout = jest.spyOn(global, 'setTimeout');
    mockClearTimeout = jest.spyOn(global, 'clearTimeout');

    // Default setup
    mockSetTimeout.mockImplementation((fn) => {
      fn(); // Execute immediately for testing
      return 123; // Mock timer ID
    });
  });

  afterEach(() => {
    mockSetTimeout.mockRestore();
    mockClearTimeout.mockRestore();
  });

  it('should scroll to element when loaded and hash exists', () => {
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockGetElementById.mockReturnValue(mockElement);
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
      }),
    );

    expect(mockGetElementById).toHaveBeenCalledWith('section-1');
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('should not scroll when data is not loaded', () => {
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    renderHook(() =>
      useScrollToHash({
        loaded: false,
        loadErr: false,
      }),
    );

    expect(mockGetElementById).not.toHaveBeenCalled();
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should not scroll when there is a load error', () => {
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: true,
      }),
    );

    expect(mockGetElementById).not.toHaveBeenCalled();
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should not scroll when there is no hash', () => {
    useLocationMock.mockReturnValue({ hash: '' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
      }),
    );

    expect(mockGetElementById).not.toHaveBeenCalled();
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should handle element not found gracefully', () => {
    mockGetElementById.mockReturnValue(null);
    useLocationMock.mockReturnValue({ hash: '#nonexistent' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
      }),
    );

    expect(mockGetElementById).toHaveBeenCalledWith('nonexistent');
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should use custom scroll options', () => {
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockGetElementById.mockReturnValue(mockElement);
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
        behavior: 'auto',
        block: 'center',
      }),
    );

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });
  });

  it('should use custom delay', () => {
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockGetElementById.mockReturnValue(mockElement);
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    // Reset setTimeout mock to check delay
    mockSetTimeout.mockRestore();
    mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((_, delayValue) => {
      expect(delayValue).toBe(500);
      return 123 as unknown as NodeJS.Timeout;
    });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
        delay: 500,
      }),
    );

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
  });

  it('should clean up timeout on unmount', () => {
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    // Reset setTimeout to return a proper timer ID
    mockSetTimeout.mockRestore();
    mockSetTimeout = jest
      .spyOn(global, 'setTimeout')
      .mockReturnValue(123 as unknown as NodeJS.Timeout);

    const { unmount } = renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
      }),
    );

    unmount();

    expect(mockClearTimeout).toHaveBeenCalledWith(123);
  });

  it('should clean up timeout when dependencies change', () => {
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockGetElementById.mockReturnValue(mockElement);
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    // Reset setTimeout to return a proper timer ID
    mockSetTimeout.mockRestore();
    mockSetTimeout = jest
      .spyOn(global, 'setTimeout')
      .mockReturnValue(123 as unknown as NodeJS.Timeout);

    const { rerender } = renderHook(
      ({ loaded }) =>
        useScrollToHash({
          loaded,
          loadErr: false,
        }),
      { initialProps: { loaded: true } },
    );

    // Change loaded state
    rerender({ loaded: false });

    expect(mockClearTimeout).toHaveBeenCalledWith(123);
  });

  it('should handle hash changes', () => {
    const mockElement1 = { scrollIntoView: mockScrollIntoView };
    const mockElement2 = { scrollIntoView: mockScrollIntoView };

    mockGetElementById.mockReturnValueOnce(mockElement1).mockReturnValueOnce(mockElement2);

    useLocationMock.mockReturnValue({ hash: '#section-1' });

    const { rerender } = renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
      }),
    );

    expect(mockGetElementById).toHaveBeenCalledWith('section-1');

    // Change hash
    useLocationMock.mockReturnValue({ hash: '#section-2' });
    rerender();

    expect(mockGetElementById).toHaveBeenCalledWith('section-2');
    expect(mockGetElementById).toHaveBeenCalledTimes(2);
  });

  it('should handle hash with multiple # characters', () => {
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockGetElementById.mockReturnValue(mockElement);
    useLocationMock.mockReturnValue({ hash: '#section#subsection' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: false,
      }),
    );

    // Should only remove the first # character
    expect(mockGetElementById).toHaveBeenCalledWith('section#subsection');
  });

  it('should not scroll when loadErr is true even if loaded is also true', () => {
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
        loadErr: true,
      }),
    );

    expect(mockGetElementById).not.toHaveBeenCalled();
  });

  it('should use default values when not specified', () => {
    const mockElement = { scrollIntoView: mockScrollIntoView };
    mockGetElementById.mockReturnValue(mockElement);
    useLocationMock.mockReturnValue({ hash: '#section-1' });

    renderHook(() =>
      useScrollToHash({
        loaded: true,
      }),
    );

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
  });
});

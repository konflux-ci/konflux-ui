import { renderHook, act } from '@testing-library/react';
import { useLineNumberNavigation } from '../useLineNumberNavigation';


const createMouseEvent = (shiftKey: boolean): React.MouseEvent => {
  const event = new MouseEvent('click') as unknown as React.MouseEvent;
  Object.defineProperty(event, 'shiftKey', { value: shiftKey });
  return event;
};

const setTestLocation = (pathname: string, search = '', hash = '') => {
  let currentHash = hash;

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      pathname,
      search,
      get hash() {
        return currentHash;
      },
      set hash(value: string) {
        // Ensure hash always includes the # prefix
        currentHash = value.startsWith('#') ? value : `#${value}`;
      },
    },
  });
};

const changeHash = (hash: string) => {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};


describe('useLineNumberNavigation', () => {
  let originalLocation: Location;
  let pushStateSpy: jest.SpyInstance;

  beforeEach(() => {
    originalLocation = window.location;

    setTestLocation('/logs', '?task=123', '');

    pushStateSpy = jest
      .spyOn(window.history, 'pushState')
      .mockImplementation((state, _title, url) => {
        // Update window.history.state to simulate pushState behavior
        Object.defineProperty(window.history, 'state', {
          value: state,
          writable: true,
          configurable: true,
        });

        // Update hash if present in URL
        if (typeof url === 'string' && url.includes('#')) {
          const hash = url.split('#')[1];
          window.location.hash = hash;
        }
      });
  });

  afterEach(() => {
    pushStateSpy.mockRestore();

    setTestLocation(originalLocation.pathname, originalLocation.search, '');
  });

  it('should initialize with no highlighted lines when no hash', () => {
    const { result } = renderHook(() => useLineNumberNavigation());

    expect(result.current.highlightedLines).toBeNull();
    expect(result.current.firstSelectedLine).toBeNull();
  });

  it('should parse single line hash on mount', () => {
    setTestLocation('/logs', '?task=123', '#L123');

    const { result } = renderHook(() => useLineNumberNavigation());

    expect(result.current.highlightedLines).toEqual({
      start: 123,
      end: 123,
    });
  });

  it('should parse range hash on mount', () => {
    setTestLocation('/logs', '?task=123', '#L10-L20');

    const { result } = renderHook(() => useLineNumberNavigation());

    expect(result.current.highlightedLines).toEqual({
      start: 10,
      end: 20,
    });
  });

  it('should select single line on click', () => {
    const { result } = renderHook(() => useLineNumberNavigation());

    act(() => {
      result.current.handleLineClick(42, createMouseEvent(true));
    });

    expect(pushStateSpy).toHaveBeenCalledWith(
      { source: 'line-click' },
      '',
      '#L42'
    );

    expect(result.current.highlightedLines).toEqual({
      start: 42,
      end: 42,
    });

    expect(result.current.firstSelectedLine).toBe(42);
  });

  it('should create range selection with shift click', () => {
    const { result } = renderHook(() => useLineNumberNavigation());

    act(() => {
      result.current.handleLineClick(10, createMouseEvent(false));
    });

    act(() => {
      result.current.handleLineClick(20, createMouseEvent(true));
    });

    expect(pushStateSpy).toHaveBeenLastCalledWith(
      { source: 'line-click' },
      '',
      '#L10-L20'
    );

    expect(result.current.highlightedLines).toEqual({
      start: 10,
      end: 20,
    });

    expect(result.current.firstSelectedLine).toBeNull();
  });

  it('should allow URL navigation on log task page', () => {
    setTestLocation('/logs', '?task=123');

    const { result } = renderHook(() => useLineNumberNavigation());

    act(() => {
      result.current.handleLineClick(10, createMouseEvent(true));
    });

    expect(window.location.hash).toBe('#L10');
  });

  it('should not update URL on non log task page', () => {
    setTestLocation('/other-page', '');

    const { result } = renderHook(() => useLineNumberNavigation());

    act(() => {
      result.current.handleLineClick(10, createMouseEvent(false));
    });

    expect(window.location.hash).toBe('');
  });

  it('should update highlight on hash change', () => {
    const { result } = renderHook(() => useLineNumberNavigation());

    changeHash('#L123');

    expect(result.current.highlightedLines).toEqual({
      start: 123,
      end: 123,
    });
  });

  it('should clear highlight when hash removed', () => {
    const { result } = renderHook(() => useLineNumberNavigation());

    changeHash('#L50');

    expect(result.current.highlightedLines).toEqual({
      start: 50,
      end: 50,
    });

    changeHash('');

    expect(result.current.highlightedLines).toBeNull();
  });

  it('should handle large line numbers', () => {
    const { result } = renderHook(() => useLineNumberNavigation());

    act(() => {
      result.current.handleLineClick(999999, createMouseEvent(false));
    });

    expect(result.current.highlightedLines).toEqual({
      start: 999999,
      end: 999999,
    });
  });
});
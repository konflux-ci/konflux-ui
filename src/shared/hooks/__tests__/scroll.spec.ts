import { renderHook, act } from '@testing-library/react-hooks';
import { getScrollDirection, useScrollDirection, ScrollDirection } from '../scroll';

describe('getScrollDirection', () => {
  it('should return scrolledToTop when scrollTop is 0', () => {
    const direction = getScrollDirection(10, 0, 1000, 200);
    expect(direction).toBe(ScrollDirection.scrolledToTop);
  });

  it('should return scrolledToBottom when scrolled to bottom', () => {
    // scrollHeight - scrollTop === clientHeight means at bottom
    const direction = getScrollDirection(500, 800, 1000, 200);
    expect(direction).toBe(ScrollDirection.scrolledToBottom);
  });

  it('should return scrollingUp when previous scroll position is greater', () => {
    const direction = getScrollDirection(150, 100, 1000, 200);
    expect(direction).toBe(ScrollDirection.scrollingUp);
  });

  it('should return scrollingDown when previous scroll position is smaller', () => {
    const direction = getScrollDirection(100, 150, 1000, 200);
    expect(direction).toBe(ScrollDirection.scrollingDown);
  });

  it('should prioritize scrolledToBottom over scrollingDown', () => {
    // Even if scrolling down, if at bottom, return scrolledToBottom
    const direction = getScrollDirection(700, 800, 1000, 200); // 1000 - 800 = 200 (clientHeight)
    expect(direction).toBe(ScrollDirection.scrolledToBottom);
  });

  it('should prioritize scrolledToTop over scrollingUp', () => {
    // Even if scrolling up, if at top, return scrolledToTop
    const direction = getScrollDirection(10, 0, 1000, 200);
    expect(direction).toBe(ScrollDirection.scrolledToTop);
  });

  it('should handle edge case when scroll positions are equal', () => {
    const direction = getScrollDirection(100, 100, 1000, 200);
    expect(direction).toBeUndefined();
  });

  it('should handle zero height container', () => {
    // With zero height, scrollHeight - scrollTop (0) === clientHeight (0), so it should be scrolledToBottom
    const direction = getScrollDirection(0, 0, 0, 0);
    expect(direction).toBe(ScrollDirection.scrolledToBottom);
  });
});

describe('useScrollDirection', () => {
  let mockEvent: React.UIEvent<HTMLElement>;

  beforeEach(() => {
    mockEvent = {
      target: {
        scrollHeight: 1000,
        scrollTop: 100,
        clientHeight: 200,
      },
    } as React.UIEvent<HTMLElement>;
  });

  it('should initialize with null scroll direction', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [scrollDirection] = result.current;

    expect(scrollDirection).toBeNull();
  });

  it('should not update direction on first scroll event', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [, handleScroll] = result.current;

    act(() => {
      handleScroll(mockEvent);
    });

    const [scrollDirection] = result.current;
    expect(scrollDirection).toBeNull();
  });

  it('should update direction on subsequent scroll events', () => {
    const { result } = renderHook(() => useScrollDirection());
    let [, handleScroll] = result.current;

    // First scroll - sets initial position
    act(() => {
      handleScroll(mockEvent);
    });

    // Second scroll - scrolling down
    act(() => {
      mockEvent.target = {
        ...mockEvent.target,
        scrollTop: 150,
      } as HTMLElement;
      handleScroll(mockEvent);
    });

    [, handleScroll] = result.current;
    const [scrollDirection] = result.current;
    expect(scrollDirection).toBe(ScrollDirection.scrollingDown);
  });

  it('should detect scrolling up', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [, handleScroll] = result.current;

    // First scroll
    act(() => {
      handleScroll(mockEvent);
    });

    // Second scroll - scrolling up
    act(() => {
      mockEvent.target = {
        ...mockEvent.target,
        scrollTop: 50,
      } as HTMLElement;
      handleScroll(mockEvent);
    });

    const [scrollDirection] = result.current;
    expect(scrollDirection).toBe(ScrollDirection.scrollingUp);
  });

  it('should detect scrolled to top', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [, handleScroll] = result.current;

    // First scroll
    act(() => {
      handleScroll(mockEvent);
    });

    // Second scroll - to top
    act(() => {
      mockEvent.target = {
        ...mockEvent.target,
        scrollTop: 0,
      } as HTMLElement;
      handleScroll(mockEvent);
    });

    const [scrollDirection] = result.current;
    expect(scrollDirection).toBe(ScrollDirection.scrolledToTop);
  });

  it('should detect scrolled to bottom', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [, handleScroll] = result.current;

    // First scroll
    act(() => {
      handleScroll(mockEvent);
    });

    // Second scroll - to bottom (scrollHeight - scrollTop === clientHeight)
    act(() => {
      mockEvent.target = {
        ...mockEvent.target,
        scrollTop: 800, // 1000 - 800 = 200 (clientHeight)
      } as HTMLElement;
      handleScroll(mockEvent);
    });

    const [scrollDirection] = result.current;
    expect(scrollDirection).toBe(ScrollDirection.scrolledToBottom);
  });

  it('should only update direction when it actually changes', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [, handleScroll] = result.current;

    // First scroll
    act(() => {
      handleScroll(mockEvent);
    });

    // Second scroll - scrolling down
    act(() => {
      mockEvent.target = {
        ...mockEvent.target,
        scrollTop: 150,
      } as HTMLElement;
      handleScroll(mockEvent);
    });

    let [scrollDirection] = result.current;
    expect(scrollDirection).toBe(ScrollDirection.scrollingDown);

    // Third scroll - still scrolling down (direction shouldn't change)
    const previousDirection = scrollDirection;
    act(() => {
      mockEvent.target = {
        ...mockEvent.target,
        scrollTop: 200,
      } as HTMLElement;
      handleScroll(mockEvent);
    });

    [scrollDirection] = result.current;
    expect(scrollDirection).toBe(ScrollDirection.scrollingDown);
    // The reference should be the same since direction didn't change
    expect(scrollDirection).toBe(previousDirection);
  });

  it('should handle rapid direction changes', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [, handleScroll] = result.current;

    // Initial scroll
    mockEvent.target = { scrollHeight: 1000, scrollTop: 100, clientHeight: 200 } as HTMLElement;
    act(() => {
      handleScroll(mockEvent);
    });

    // Scroll down
    mockEvent.target = { ...mockEvent.target, scrollTop: 150 } as HTMLElement;
    act(() => {
      handleScroll(mockEvent);
    });
    expect(result.current[0]).toBe(ScrollDirection.scrollingDown);

    // Scroll up
    mockEvent.target = { ...mockEvent.target, scrollTop: 120 } as HTMLElement;
    act(() => {
      handleScroll(mockEvent);
    });
    expect(result.current[0]).toBe(ScrollDirection.scrollingUp);

    // Scroll to top
    mockEvent.target = { ...mockEvent.target, scrollTop: 0 } as HTMLElement;
    act(() => {
      handleScroll(mockEvent);
    });
    expect(result.current[0]).toBe(ScrollDirection.scrolledToTop);
  });

  it('should maintain callback reference stability when direction does not change', () => {
    const { result, rerender } = renderHook(() => useScrollDirection());
    const [, initialHandleScroll] = result.current;

    rerender();
    const [, handleScrollAfterRerender] = result.current;

    expect(initialHandleScroll).toBe(handleScrollAfterRerender);
  });

  it('should handle scroll events with different target properties', () => {
    const { result } = renderHook(() => useScrollDirection());
    const [, handleScroll] = result.current;

    // Different container dimensions
    const customEvent = {
      target: {
        scrollHeight: 2000,
        scrollTop: 500,
        clientHeight: 400,
      },
    } as React.UIEvent<HTMLElement>;

    act(() => {
      handleScroll(customEvent);
    });

    // Scroll within this container
    act(() => {
      customEvent.target = {
        ...customEvent.target,
        scrollTop: 600,
      } as HTMLElement;
      handleScroll(customEvent);
    });

    const [scrollDirection] = result.current;
    expect(scrollDirection).toBe(ScrollDirection.scrollingDown);
  });
});

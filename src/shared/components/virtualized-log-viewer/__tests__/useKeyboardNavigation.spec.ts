import { Virtualizer } from '@tanstack/react-virtual';
import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  let mockVirtualizer: Partial<Virtualizer<HTMLDivElement, Element>>;
  let mockScrollElement: HTMLDivElement;
  let scrollElementRef: React.RefObject<HTMLDivElement>;
  let scrollTopValue: number;

  // 🔧 setup helpers
  const setup = (enabled = true) => {
    mockScrollElement.focus();

    return renderHook(() =>
      useKeyboardNavigation({
        virtualizer: mockVirtualizer as Virtualizer<HTMLDivElement, Element>,
        scrollElementRef,
        enabled,
      }),
    );
  };

  const fireKey = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
    document.dispatchEvent(event);
  };

  beforeEach(() => {
    mockScrollElement = document.createElement('div');
    mockScrollElement.tabIndex = 0;
    document.body.appendChild(mockScrollElement);

    Object.defineProperty(mockScrollElement, 'clientHeight', {
      configurable: true,
      value: 500,
    });

    scrollTopValue = 100;
    Object.defineProperty(mockScrollElement, 'scrollTop', {
      configurable: true,
      get() {
        return scrollTopValue;
      },
      set(value) {
        scrollTopValue = value;
      },
    });

    scrollElementRef = { current: mockScrollElement };

    mockVirtualizer = {
      scrollOffset: 100,
      getTotalSize: jest.fn(() => 5000),
      options: {
        estimateSize: jest.fn(() => 20),
      },
    } as unknown as Virtualizer<HTMLDivElement, Element>;
  });

  afterEach(() => {
    document.body.removeChild(mockScrollElement);
    jest.clearAllMocks();
  });

  // ================= Arrow keys =================
  describe('Arrow keys', () => {
    it('handles ArrowDown', () => {
      setup();

      fireKey('ArrowDown');

      expect(mockScrollElement.scrollTop).toBe(120);
    });

    it('handles ArrowUp', () => {
      mockScrollElement.scrollTop = 120;
      setup();

      fireKey('ArrowUp');

      expect(mockScrollElement.scrollTop).toBe(100);
    });

    it('does not scroll below 0', () => {
      mockScrollElement.scrollTop = 10;
      setup();

      fireKey('ArrowUp');

      expect(mockScrollElement.scrollTop).toBe(0);
    });

    it('does not scroll beyond max on ArrowDown', () => {
      mockScrollElement.scrollTop = 4495;
      setup();

      fireKey('ArrowDown');

      expect(mockScrollElement.scrollTop).toBe(4500);
    });
  });

  // ================= Page keys =================
  describe('Page keys', () => {
    it('handles PageDown', () => {
      setup();

      fireKey('PageDown');

      expect(mockScrollElement.scrollTop).toBe(600);
    });

    it('handles PageUp', () => {
      mockScrollElement.scrollTop = 600;
      setup();

      fireKey('PageUp');

      expect(mockScrollElement.scrollTop).toBe(100);
    });

    it('does not scroll below 0 on PageUp', () => {
      mockScrollElement.scrollTop = 100;
      setup();

      fireKey('PageUp');

      expect(mockScrollElement.scrollTop).toBe(0);
    });

    it('does not scroll beyond max on PageDown', () => {
      mockScrollElement.scrollTop = 4800;
      setup();

      fireKey('PageDown');

      expect(mockScrollElement.scrollTop).toBe(5000);
    });
  });

  // ================= Home / End =================
  describe('Home / End keys', () => {
    it('handles Home', () => {
      setup();

      fireKey('Home');

      expect(mockScrollElement.scrollTop).toBe(0);
    });

    it('handles End', () => {
      setup();

      fireKey('End');

      expect(mockScrollElement.scrollTop).toBe(5000);
    });
  });

  // ================= misc =================
  describe('other behaviors', () => {
    it('ignores unsupported keys', () => {
      const initial = mockScrollElement.scrollTop;
      setup();

      fireKey('Tab');

      expect(mockScrollElement.scrollTop).toBe(initial);
    });

    it('does nothing when disabled', () => {
      const initial = mockScrollElement.scrollTop;
      setup(false);

      fireKey('PageDown');

      expect(mockScrollElement.scrollTop).toBe(initial);
    });

    it('cleans up event listener on unmount', () => {
      const spy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = setup();

      unmount();

      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});

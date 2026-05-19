import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

const TestComponent: React.FC<{
  scrollElementRef: React.RefObject<HTMLDivElement>;
  lineHeight?: number;
  enabled?: boolean;
}> = ({ scrollElementRef, lineHeight, enabled = true }) => {
  const navRef = useKeyboardNavigation({ scrollElementRef, lineHeight, enabled });

  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      (scrollElementRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      (navRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [scrollElementRef, navRef],
  );

  return React.createElement('div', {
    ref,
    tabIndex: 0,
    'data-test': 'scroll-container',
    style: { height: '500px', overflow: 'auto' },
  });
};

describe('useKeyboardNavigation', () => {
  let scrollTopValue: number;

  const setup = (enabled = true) => {
    const scrollElementRef: React.MutableRefObject<HTMLDivElement | null> = { current: null };

    const result = render(
      React.createElement(TestComponent, {
        scrollElementRef,
        lineHeight: 20,
        enabled,
      }),
    );

    const scrollContainer = result.getByTestId('scroll-container');

    scrollTopValue = 100;
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      get() {
        return scrollTopValue;
      },
      set(value: number) {
        scrollTopValue = value;
      },
    });

    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });

    Object.defineProperty(scrollContainer, 'scrollHeight', {
      configurable: true,
      value: 5000,
    });

    act(() => {
      scrollContainer.focus();
    });

    return { scrollContainer };
  };

  // useHotkeys attaches native event listeners, so userEvent (synthetic events) won't trigger them
  const fireKey = (element: HTMLElement, key: string) => {
    act(() => {
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          code: key,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  };

  afterEach(() => {
    cleanup();
  });

  describe('Arrow keys', () => {
    it('handles ArrowDown', () => {
      const { scrollContainer } = setup();
      fireKey(scrollContainer, 'ArrowDown');
      expect(scrollTopValue).toBe(120);
    });

    it('handles ArrowUp', () => {
      const { scrollContainer } = setup();
      scrollTopValue = 120;
      fireKey(scrollContainer, 'ArrowUp');
      expect(scrollTopValue).toBe(100);
    });

    it('does not scroll below 0', () => {
      const { scrollContainer } = setup();
      scrollTopValue = 10;
      fireKey(scrollContainer, 'ArrowUp');
      expect(scrollTopValue).toBe(0);
    });
  });

  describe('Page keys', () => {
    it('handles PageDown', () => {
      const { scrollContainer } = setup();
      fireKey(scrollContainer, 'PageDown');
      expect(scrollTopValue).toBe(600);
    });

    it('handles PageUp', () => {
      const { scrollContainer } = setup();
      scrollTopValue = 600;
      fireKey(scrollContainer, 'PageUp');
      expect(scrollTopValue).toBe(100);
    });

    it('does not scroll below 0 on PageUp', () => {
      const { scrollContainer } = setup();
      scrollTopValue = 100;
      fireKey(scrollContainer, 'PageUp');
      expect(scrollTopValue).toBe(0);
    });
  });

  describe('Home / End keys', () => {
    it('handles Home', () => {
      const { scrollContainer } = setup();
      fireKey(scrollContainer, 'Home');
      expect(scrollTopValue).toBe(0);
    });

    it('handles End', () => {
      const { scrollContainer } = setup();
      fireKey(scrollContainer, 'End');
      expect(scrollTopValue).toBe(5000);
    });
  });

  describe('other behaviors', () => {
    it('ignores unsupported keys', () => {
      const { scrollContainer } = setup();
      const initial = scrollTopValue;
      fireKey(scrollContainer, 'Tab');
      expect(scrollTopValue).toBe(initial);
    });

    it('does nothing when disabled', () => {
      const { scrollContainer } = setup(false);
      const initial = scrollTopValue;
      fireKey(scrollContainer, 'PageDown');
      expect(scrollTopValue).toBe(initial);
    });

    it('does nothing when scrollElementRef is null', () => {
      const nullRef: React.MutableRefObject<HTMLDivElement | null> = { current: null };
      const result = render(
        React.createElement(TestComponent, {
          scrollElementRef: nullRef,
          enabled: true,
        }),
      );
      const el = result.getByTestId('scroll-container');
      scrollTopValue = 100;
      nullRef.current = null;
      el.focus();
      fireKey(el, 'ArrowDown');
      expect(scrollTopValue).toBe(100);
    });
  });
});

import { renderHook } from '@testing-library/react';
import { useAIChatScrollToBottom } from '~/components/AIChat/hooks/useAIChatScrollToBottom';

describe('useAIChatScrollToBottom', () => {
  it('scrolls the ref target into view when the dependency changes', () => {
    const scrollIntoView = jest.fn();
    const { result, rerender } = renderHook(
      ({ dependency }) => useAIChatScrollToBottom(dependency),
      { initialProps: { dependency: ['msg-1'] } },
    );

    Object.defineProperty(result.current, 'current', {
      configurable: true,
      value: { scrollIntoView },
    });

    rerender({ dependency: ['msg-1', 'msg-2'] });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
  });

  it('does not throw when the ref has not been attached yet', () => {
    expect(() => {
      renderHook(() => useAIChatScrollToBottom(['msg-1']));
    }).not.toThrow();
  });
});

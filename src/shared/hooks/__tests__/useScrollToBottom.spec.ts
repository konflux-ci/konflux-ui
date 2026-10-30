import { renderHook } from '@testing-library/react';
import { useScrollToBottom } from '~/shared/hooks/useScrollToBottom';

describe('useScrollToBottom', () => {
  it('scrolls the ref target into view when the dependency changes', () => {
    const scrollIntoView = jest.fn();
    const { result, rerender } = renderHook(
      ({ dependency }) => useScrollToBottom(dependency),
      { initialProps: { dependency: ['msg-1'] } },
    );

    Object.defineProperty(result.current, 'current', {
      configurable: true,
      value: { scrollIntoView },
    });

    rerender({ dependency: ['msg-1', 'msg-2'] });

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
  });
});

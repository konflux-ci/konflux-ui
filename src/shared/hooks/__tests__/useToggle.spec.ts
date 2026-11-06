import { act, renderHook } from '@testing-library/react';
import { useToggle } from '~/shared/hooks/useToggle';

describe('useToggle', () => {
  it('toggles its state from the initial value', () => {
    const { result } = renderHook(() => useToggle());

    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);
  });
});

import { act, renderHook } from '@testing-library/react';
import { useAIChatVisibility } from '~/components/AIChat/hooks/useAIChatVisibility';

describe('useAIChatVisibility', () => {
  it('starts hidden', () => {
    const { result } = renderHook(() => useAIChatVisibility());

    expect(result.current.isVisible).toBe(false);
  });

  it('toggles visibility open and closed', () => {
    const { result } = renderHook(() => useAIChatVisibility());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isVisible).toBe(false);
  });

  it('hides the panel when hide is called', () => {
    const { result } = renderHook(() => useAIChatVisibility());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.hide();
    });
    expect(result.current.isVisible).toBe(false);
  });

  it('invokes onHide when the panel is not visible', () => {
    const onHide = jest.fn();
    const { result } = renderHook(() => useAIChatVisibility(onHide));

    expect(onHide).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isVisible).toBe(true);
    expect(onHide).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.hide();
    });
    expect(onHide).toHaveBeenCalledTimes(2);
  });
});

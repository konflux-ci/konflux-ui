import { renderHook, act } from '@testing-library/react-hooks';
import { useLazyActionMenu, composeLazyActions } from '../useLazyActionMenu';

type TestAction = { label: string; disabled?: boolean; disabledTooltip?: string };

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('useLazyActionMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns built actions directly in non-lazy mode', () => {
    const buildActions = jest.fn<TestAction[], [unknown?]>(() => [{ label: 'A', disabled: false }]);

    const { result } = renderHook(() =>
      useLazyActionMenu<TestAction>({
        buildActions,
      }),
    );

    const [actions, onOpen] = result.current;

    expect(buildActions).toHaveBeenCalledWith(undefined);
    expect(actions).toEqual([{ label: 'A', disabled: false }]);

    act(() => onOpen(true));

    // non-lazy mode should not call buildActions with any context nor change actions
    expect(buildActions).toHaveBeenLastCalledWith(undefined);
    expect(result.current[0]).toEqual([{ label: 'A', disabled: false }]);
  });

  it('lazy mode: initially returns disabled actions and does not trigger loading until opened', () => {
    const loadContext = jest.fn<Promise<unknown>, []>();
    const buildActions = jest.fn<TestAction[], [unknown?]>(() => [{ label: 'A' }]);

    const { result } = renderHook(() =>
      useLazyActionMenu<TestAction>({ buildActions, loadContext }),
    );

    const [actions] = result.current;

    // initially disabled with tooltip while awaiting open
    expect(actions[0]).toEqual(
      expect.objectContaining({ disabled: true, disabledTooltip: 'Checking permissions...' }),
    );

    // loadContext should not have been called yet
    expect(loadContext).not.toHaveBeenCalled();
  });

  it('lazy mode: disables while loading and re-enables after context resolves', async () => {
    const deferred = createDeferred<{ user: string }>();
    const loadContext = jest.fn(() => deferred.promise);
    const buildActions = jest
      .fn<TestAction[], [unknown?]>()
      // first call (before open or while loading): no context
      .mockImplementation(() => [{ label: 'A' }]);

    const { result } = renderHook(() =>
      useLazyActionMenu<TestAction>({ buildActions, loadContext }),
    );

    // open menu to trigger context load
    act(() => {
      const [, onOpen] = result.current;
      onOpen(true);
    });

    // while loading: actions disabled with tooltip
    expect(result.current[0][0]).toEqual(
      expect.objectContaining({ disabled: true, disabledTooltip: 'Checking permissions...' }),
    );

    // resolve context
    await act(async () => {
      deferred.resolve({ user: 'alice' });
      await Promise.resolve();
    });

    // after resolve: buildActions should have been called again with context
    expect(buildActions).toHaveBeenCalled();
    // last call should pass resolved context
    const lastCallArgs = buildActions.mock.calls[buildActions.mock.calls.length - 1][0];
    expect(lastCallArgs).toEqual({ user: 'alice' });

    // actions should be re-enabled (no forced disabled state)
    expect(result.current[0][0].disabled).not.toBe(true);
    expect(result.current[0][0].disabledTooltip).toBeUndefined();
  });

  it('lazy mode: loadContext is called only once even with multiple opens', async () => {
    const deferred = createDeferred<{ loaded: true }>();
    const loadContext = jest.fn(() => deferred.promise);
    const buildActions = jest.fn<TestAction[], [unknown?]>(() => [{ label: 'A' }]);

    const { result } = renderHook(() =>
      useLazyActionMenu<TestAction>({ buildActions, loadContext }),
    );

    act(() => {
      const [, onOpen] = result.current;
      onOpen(true);
    });

    // allow state to process and set `loading` before second call
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      const [, onOpen] = result.current;
      onOpen(true);
    });

    expect(loadContext).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ loaded: true });
      await Promise.resolve();
    });

    act(() => {
      const [, onOpen] = result.current;
      onOpen(true);
    });

    // still only once because context is already loaded
    expect(loadContext).toHaveBeenCalledTimes(1);
  });
});

describe('composeLazyActions', () => {
  it('combines actions and forwards onOpen to all hooks', () => {
    const onOpenA = jest.fn();
    const onOpenB = jest.fn();
    const a: TestAction[] = [{ label: 'A' }];
    const b: TestAction[] = [{ label: 'B' }];

    const [actions, onOpen] = composeLazyActions<TestAction>([a, onOpenA], [b, onOpenB]);

    expect(actions).toEqual([{ label: 'A' }, { label: 'B' }]);

    onOpen(true);
    expect(onOpenA).toHaveBeenCalledWith(true);
    expect(onOpenB).toHaveBeenCalledWith(true);

    onOpen(false);
    expect(onOpenA).toHaveBeenCalledWith(false);
    expect(onOpenB).toHaveBeenCalledWith(false);
  });
});

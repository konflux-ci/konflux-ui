import { renderHook } from '@testing-library/react-hooks';
import { useTaskStore, BackgroundJobStatus } from '~/utils/task-store';
import { usePreventWindowCloseIfTaskRunning } from '../usePreventWindowClose';

jest.mock('~/utils/task-store', () => ({
  useTaskStore: jest.fn(),
  BackgroundJobStatus: {
    Running: 'Running',
    Successed: 'Successed',
    Pending: 'Pending',
    Failed: 'Failed',
  },
}));

const useTaskStoreMock = useTaskStore as unknown as jest.Mock;

describe('usePreventWindowCloseIfTaskRunning', () => {
  const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
  const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false and does not add beforeunload listener when no running tasks', () => {
    useTaskStoreMock.mockReturnValue({ task1: { status: BackgroundJobStatus.Succeeded } });

    const { result, unmount } = renderHook(() => usePreventWindowCloseIfTaskRunning());

    expect(result.current).toBe(false);
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('returns true and adds beforeunload listener when there is a running task', () => {
    useTaskStoreMock.mockReturnValue({ task1: { status: BackgroundJobStatus.Running } });

    const { result, unmount } = renderHook(() => usePreventWindowCloseIfTaskRunning());

    expect(result.current).toBe(true);
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('beforeunload event handler prevents unload when task is running', () => {
    useTaskStoreMock.mockReturnValue({ task1: { status: BackgroundJobStatus.Running } });

    let beforeUnloadHandler: (e: BeforeUnloadEvent) => void;

    addEventListenerSpy.mockImplementation((event, handler) => {
      if (event === 'beforeunload') {
        beforeUnloadHandler = handler as (e: BeforeUnloadEvent) => void;
      }
    });

    renderHook(() => usePreventWindowCloseIfTaskRunning());

    expect(beforeUnloadHandler).toBeDefined();

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    Object.defineProperty(event, 'returnValue', {
      writable: true,
      value: '',
    });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    beforeUnloadHandler(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(event.returnValue).toBe('');
  });

  it('beforeunload event handler does nothing when no running task', () => {
    useTaskStoreMock.mockReturnValue({ task1: { status: BackgroundJobStatus.Succeeded } });

    let beforeUnloadHandler: (e: BeforeUnloadEvent) => void;

    addEventListenerSpy.mockImplementation((event, handler) => {
      if (event === 'beforeunload') {
        beforeUnloadHandler = handler as (e: BeforeUnloadEvent) => void;
      }
    });

    renderHook(() => usePreventWindowCloseIfTaskRunning());

    expect(beforeUnloadHandler).toBeDefined();

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    beforeUnloadHandler(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

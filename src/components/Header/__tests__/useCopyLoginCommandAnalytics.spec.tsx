import * as React from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { renderHook, act } from '@testing-library/react';
import { TrackEvents } from '~/analytics';
import { useCopyLoginCommandAnalytics } from '../useCopyLoginCommandAnalytics';

jest.mock('~/analytics/hooks', () => ({
  useTrackAnalyticsEvent: jest.fn(),
}));

const useTrackAnalyticsEventMock = jest.requireMock('~/analytics/hooks')
  .useTrackAnalyticsEvent as jest.Mock;

let trackEventMock: jest.Mock;

const createWrapper = (initialPath: string) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/ns/:workspace/*" element={children} />
        <Route path="/other" element={children} />
        <Route path="*" element={children} />
      </Routes>
    </MemoryRouter>
  );
  return Wrapper;
};

const useAnalyticsWithNavigate = () => {
  const analytics = useCopyLoginCommandAnalytics();
  const navigate = useNavigate();
  return { analytics, navigate };
};

describe('useCopyLoginCommandAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    trackEventMock = jest.fn();
    useTrackAnalyticsEventMock.mockReturnValue(trackEventMock);
  });

  it('tracks userMenuOpenedBefore false when user menu was not opened', () => {
    const { result } = renderHook(() => useCopyLoginCommandAnalytics(), {
      wrapper: createWrapper('/ns/my-tenant/applications'),
    });

    act(() => {
      result.current.onCopyLoginCommandClick();
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.copy_login_command_clicked_event, {
      userMenuOpenedBefore: false,
    });
  });

  it('tracks userMenuOpenedBefore true after user menu open on same pathname', () => {
    const { result } = renderHook(() => useCopyLoginCommandAnalytics(), {
      wrapper: createWrapper('/ns/my-tenant/applications'),
    });

    act(() => {
      result.current.onUserMenuOpen();
    });
    act(() => {
      result.current.onCopyLoginCommandClick();
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.copy_login_command_clicked_event, {
      userMenuOpenedBefore: true,
    });
  });

  it('tracks false after navigating to a different pathname', () => {
    const { result } = renderHook(() => useAnalyticsWithNavigate(), {
      wrapper: createWrapper('/ns/my-tenant/applications'),
    });

    act(() => {
      result.current.analytics.onUserMenuOpen();
    });
    act(() => {
      result.current.navigate('/other');
    });
    act(() => {
      result.current.analytics.onCopyLoginCommandClick();
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.copy_login_command_clicked_event, {
      userMenuOpenedBefore: false,
    });
  });

  it('tracks false after leaving and returning to the same pathname', () => {
    const { result } = renderHook(() => useAnalyticsWithNavigate(), {
      wrapper: createWrapper('/ns/my-tenant/applications'),
    });

    act(() => {
      result.current.analytics.onUserMenuOpen();
    });
    act(() => {
      result.current.navigate('/other');
    });
    act(() => {
      result.current.navigate('/ns/my-tenant/applications');
    });
    act(() => {
      result.current.analytics.onCopyLoginCommandClick();
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.copy_login_command_clicked_event, {
      userMenuOpenedBefore: false,
    });
  });

  it('tracks true when only the query string changes', () => {
    const { result } = renderHook(() => useAnalyticsWithNavigate(), {
      wrapper: createWrapper('/ns/my-tenant/applications?tab=overview'),
    });

    act(() => {
      result.current.analytics.onUserMenuOpen();
    });
    act(() => {
      result.current.navigate('/ns/my-tenant/applications?tab=builds');
    });
    act(() => {
      result.current.analytics.onCopyLoginCommandClick();
    });

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith(TrackEvents.copy_login_command_clicked_event, {
      userMenuOpenedBefore: true,
    });
  });

  it('resets the flag after each copy login command click', () => {
    const { result } = renderHook(() => useCopyLoginCommandAnalytics(), {
      wrapper: createWrapper('/ns/my-tenant/applications'),
    });

    act(() => {
      result.current.onUserMenuOpen();
    });
    act(() => {
      result.current.onCopyLoginCommandClick();
    });
    act(() => {
      result.current.onCopyLoginCommandClick();
    });

    expect(trackEventMock).toHaveBeenCalledTimes(2);
    expect(trackEventMock.mock.calls[0]).toEqual([
      TrackEvents.copy_login_command_clicked_event,
      { userMenuOpenedBefore: true },
    ]);
    expect(trackEventMock.mock.calls[1]).toEqual([
      TrackEvents.copy_login_command_clicked_event,
      { userMenuOpenedBefore: false },
    ]);
  });
});

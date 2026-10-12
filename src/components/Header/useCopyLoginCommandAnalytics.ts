import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { TrackEvents } from '~/analytics';
import { useTrackAnalyticsEvent } from '~/analytics/hooks';

export const useCopyLoginCommandAnalytics = () => {
  const { pathname } = useLocation();
  const trackEvent = useTrackAnalyticsEvent();
  const userMenuOpenedOnPathRef = React.useRef('');

  React.useEffect(() => {
    if (userMenuOpenedOnPathRef.current !== '' && userMenuOpenedOnPathRef.current !== pathname) {
      userMenuOpenedOnPathRef.current = '';
    }
  }, [pathname]);

  const onUserMenuOpen = React.useCallback(() => {
    userMenuOpenedOnPathRef.current = pathname;
  }, [pathname]);

  const onCopyLoginCommandClick = React.useCallback(() => {
    trackEvent(TrackEvents.copy_login_command_clicked_event, {
      userMenuOpenedBefore: userMenuOpenedOnPathRef.current === pathname,
    });
    userMenuOpenedOnPathRef.current = '';
  }, [trackEvent, pathname]);

  return { onUserMenuOpen, onCopyLoginCommandClick };
};

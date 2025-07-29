import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Page, PageSection } from '@patternfly/react-core';
import { NAMESPACE_LIST_PATH } from '@routes/paths';
import { KonfluxBanner } from '~/components/KonfluxBanner/KonfluxBanner';
import NotificationCenter from '~/components/KonfluxSystemNotifications/NotificationList';
import { useLastReadTime } from '~/components/KonfluxSystemNotifications/useLastReadTime';
import { useSystemNotifications } from '~/components/KonfluxSystemNotifications/useSystemNotifications';
import SidePanelHost from '~/components/SidePanel/SidePanelHost';
import { usePreventWindowCloseIfTaskRunning } from '~/shared/hooks/usePreventWindowClose';
import { useActiveRouteChecker } from '../hooks/useActiveRouteChecker';
import { NamespaceSwitcher } from '../shared/providers/Namespace/NamespaceSwitcher';
import ActivePageAlert from './ActivePageAlert';
import { AppHeader } from './AppHeader';
import { AppSideBar } from './AppSideBar';

const namespaceSwitcherNotAllowedRoutes = [NAMESPACE_LIST_PATH.path, '/'];

export const AppRoot: React.FC = () => {
  const [isSideBarOpen, setSideBarOpen] = React.useState<boolean>(true);
  const isActive = useActiveRouteChecker();
  usePreventWindowCloseIfTaskRunning();

  const showSwitcher = React.useMemo(() => {
    return namespaceSwitcherNotAllowedRoutes.map((r) => isActive(r, { exact: true })).some(Boolean);
  }, [isActive]);

  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  // Move notification state to AppRoot level
  const { alerts, isLoading, error } = useSystemNotifications();
  const { lastReadTimeState, markAllRead } = useLastReadTime();

  // Calculate unread count at AppRoot level
  const unreadCount = React.useMemo(() => {
    return alerts.filter((alert) => new Date(alert.created).getTime() > lastReadTimeState).length;
  }, [alerts, lastReadTimeState]);

  const toggleDrawer = () => setIsDrawerExpanded((prev) => !prev);
  const closeDrawer = () => setIsDrawerExpanded(false);

  return (
    <>
      <KonfluxBanner />
      <Page
        sidebar={<AppSideBar isOpen={isSideBarOpen} />}
        header={
          <AppHeader
            toggleDrawer={toggleDrawer}
            isSideBarOpen={isSideBarOpen}
            onSideBarOpen={() => setSideBarOpen((s) => !s)}
            isDrawerExpanded={isDrawerExpanded}
            unreadCount={2}
          />
        }
        notificationDrawer={
          <NotificationCenter
            isDrawerExpanded={isDrawerExpanded}
            closeDrawer={closeDrawer}
            alerts={alerts}
            isLoading={isLoading}
            error={error}
            unreadCount={unreadCount}
            onMarkAllRead={markAllRead}
            lastReadTimeState={lastReadTimeState}
          />
        }
        isNotificationDrawerExpanded={isDrawerExpanded}
      >
        <ActivePageAlert />
        <SidePanelHost>
          {!showSwitcher ? (
            <PageSection variant="light" style={{ paddingBlock: 0 }} hasShadowBottom>
              <NamespaceSwitcher />
            </PageSection>
          ) : null}

          <Outlet />
        </SidePanelHost>
      </Page>
    </>
  );
};

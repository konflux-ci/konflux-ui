import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Page, PageSection } from '@patternfly/react-core';
import { NAMESPACE_LIST_PATH, RELEASE_MONITOR_PATH } from '@routes/paths';
import { KonfluxBanner } from '~/components/KonfluxBanner/KonfluxBanner';
import NotificationCenter from '~/components/KonfluxSystemNotifications/NotificationList';
import SidePanelHost from '~/components/SidePanel/SidePanelHost';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { usePreventWindowCloseIfTaskRunning } from '~/shared/hooks/usePreventWindowClose';
import { useActiveRouteChecker } from '../hooks/useActiveRouteChecker';
import { NamespaceSwitcher } from '../shared/providers/Namespace/NamespaceSwitcher';
import ActivePageAlert from './ActivePageAlert';
import { AppHeader } from './AppHeader';
import { AppSideBar } from './AppSideBar';

const namespaceSwitcherNotAllowedRoutes = [
  RELEASE_MONITOR_PATH.path,
  NAMESPACE_LIST_PATH.path,
  '/',
];

export const AppRoot: React.FC = () => {
  const [isSideBarOpen, setSideBarOpen] = React.useState<boolean>(true);
  const isActive = useActiveRouteChecker();
  usePreventWindowCloseIfTaskRunning();
  const isSystemNotificationsEnabled = useIsOnFeatureFlag('system-notifications');

  const showSwitcher = React.useMemo(() => {
    return namespaceSwitcherNotAllowedRoutes.map((r) => isActive(r, { exact: true })).some(Boolean);
  }, [isActive]);

  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const toggleDrawer = React.useCallback(() => setIsDrawerExpanded((prev) => !prev), []);
  const closeDrawer = React.useCallback(() => setIsDrawerExpanded(false), []);

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
          />
        }
        notificationDrawer={
          isSystemNotificationsEnabled ? (
            <NotificationCenter isDrawerExpanded={isDrawerExpanded} closeDrawer={closeDrawer} />
          ) : undefined
        }
        isNotificationDrawerExpanded={isSystemNotificationsEnabled && isDrawerExpanded}
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

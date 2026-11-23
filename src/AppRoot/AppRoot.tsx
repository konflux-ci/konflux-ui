import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Page, PageSection } from '@patternfly/react-core';
import { NAMESPACE_LIST_PATH, RELEASE_MONITOR_PATH } from '@routes/paths';
import { useJourneyTracker } from '~/analytics/hooks';
import { AIChatGate } from '~/components/AIChat/AIChatGate';
import SidePanelHost from '~/components/SidePanel/SidePanelHost';
import { usePreventWindowCloseIfTaskRunning } from '~/shared/hooks/usePreventWindowClose';
import { KonfluxBanner } from '../components/KonfluxBanner/KonfluxBanner';
import { useActiveRouteChecker } from '../hooks/useActiveRouteChecker';
import { NamespaceSwitcher } from '../shared/providers/Namespace/NamespaceSwitcher';
import ActivePageAlert from './ActivePageAlert';
import { AppHeader } from './AppHeader';
import { AppSideBar } from './AppSideBar';

import './AppRoot.scss';

const namespaceSwitcherNotAllowedRoutes = [
  RELEASE_MONITOR_PATH.path,
  NAMESPACE_LIST_PATH.path,
  '/',
];

export const AppRoot: React.FC = () => {
  const [isSideBarOpen, setSideBarOpen] = React.useState<boolean>(true);
  const isActive = useActiveRouteChecker();
  usePreventWindowCloseIfTaskRunning();
  useJourneyTracker();

  const showSwitcher = React.useMemo(() => {
    return namespaceSwitcherNotAllowedRoutes.map((r) => isActive(r, { exact: true })).some(Boolean);
  }, [isActive]);

  return (
    <>
      <KonfluxBanner />
      <Page
        sidebar={<AppSideBar isOpen={isSideBarOpen} />}
        masthead={
          <AppHeader
            isSideBarOpen={isSideBarOpen}
            onSideBarOpen={() => setSideBarOpen((s) => !s)}
          />
        }
      >
        <ActivePageAlert />
        <SidePanelHost>
          {!showSwitcher ? (
            <PageSection className="pf-v6-u-py-sm" hasShadowBottom>
              <NamespaceSwitcher />
            </PageSection>
          ) : null}

          <Outlet />
        </SidePanelHost>
      </Page>
      <AIChatGate />
    </>
  );
};

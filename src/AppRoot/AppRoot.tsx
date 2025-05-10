import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Page, PageSection } from '@patternfly/react-core';
import { NAMESPACE_LIST_PATH } from '@routes/paths';
import { KonfluxBanner } from '~/components/konfluxBanner/KonfluxBanner';
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
  return (
    <>
      <KonfluxBanner />
      <Page
        sidebar={<AppSideBar isOpen={isSideBarOpen} />}
        header={
          <AppHeader
            isSideBarOpen={isSideBarOpen}
            onSideBarOpen={() => setSideBarOpen((s) => !s)}
          />
        }
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

import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Page, PageSection } from '@patternfly/react-core';
import { useNamespace } from '../shared/providers/Namespace';
import { NamespaceSwitcher } from '../shared/providers/Namespace/NamespaceSwitcher';
import { AppHeader } from './AppHeader';
import { AppSideBar } from './AppSideBar';

export const AppRoot: React.FC = () => {
  const [isSideBarOpen, setSideBarOpen] = React.useState<boolean>(true);
  const namespace = useNamespace();
  return (
    <Page
      sidebar={<AppSideBar isOpen={isSideBarOpen} />}
      header={
        <AppHeader isSideBarOpen={isSideBarOpen} onSideBarOpen={() => setSideBarOpen((s) => !s)} />
      }
    >
      {namespace ? (
        <PageSection variant="light" hasShadowBottom>
          <NamespaceSwitcher />
        </PageSection>
      ) : null}
      <Outlet />
    </Page>
  );
};

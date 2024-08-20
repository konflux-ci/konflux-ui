import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Page } from '@patternfly/react-core';
import { AppHeader } from './AppHeader';
import { AppSideBar } from './AppSideBar';

export const AppRoot: React.FC = () => {
  const [isSideBarOpen, setSideBarOpen] = React.useState<boolean>(true);

  return (
    <Page
      sidebar={<AppSideBar isOpen={isSideBarOpen} />}
      header={
        <AppHeader isSideBarOpen={isSideBarOpen} onSideBarOpen={() => setSideBarOpen((s) => !s)} />
      }
    >
      <Outlet />
    </Page>
  );
};

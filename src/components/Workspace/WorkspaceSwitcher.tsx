import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ContextMenuItem, ContextSwitcher } from '../../shared/components';
import { useWorkspaceInfo } from './useWorkspaceInfo';
import { createWorkspaceQueryOptions } from './utils';

/**
 *
 * @deprecated
 */
export const WorkspaceSwitcher: React.FC<
  React.PropsWithChildren<{ selectedWorkspace?: string }>
> = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: workspaces } = useQuery(createWorkspaceQueryOptions());
  const { workspace } = useWorkspaceInfo();

  const menuItems = React.useMemo(
    () => workspaces?.map((app) => ({ key: app.metadata.name, name: app.metadata.name })) || [],
    [workspaces],
  );
  const selectedItem =
    workspaces?.find((item) => item.metadata.name === workspace) || workspaces?.[0];

  const onSelect = (item: ContextMenuItem) => {
    // switch to new workspace but keep the first segment of the URL
    navigate(
      pathname.replace(/\/workspaces\/[-a-z0-9]+\/?([-a-z0-9]*).*/, `/workspaces/${item.name}/$1`),
    );
  };

  return workspaces?.length > 0 ? (
    <ContextSwitcher
      resourceType="workspace"
      menuItems={menuItems}
      selectedItem={{ key: selectedItem?.metadata.name, name: selectedItem?.metadata.name }}
      onSelect={onSelect}
      footer={<></>}
    />
  ) : null;
};
